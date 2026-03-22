import { Injectable, Logger, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import Stripe from 'stripe';
import { ErrorCode, errorPayload } from '../common/error-codes';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;
  private stripeKeyHash: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  private async getStripe(): Promise<Stripe> {
    const stripeKey = await this.platformConfig.get('stripe.secretKey');
    if (!stripeKey) {
      throw new ServiceUnavailableException(
        'Billing is not configured. Set stripe.secretKey in Admin → Settings.',
      );
    }
    if (!this.stripe || this.stripeKeyHash !== stripeKey) {
      this.stripe = new Stripe(stripeKey);
      this.stripeKeyHash = stripeKey;
    }
    return this.stripe;
  }

  async getSubscription(practiceId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { practiceId },
    });

    if (!subscription) {
      throw new NotFoundException(errorPayload(ErrorCode.NO_SUBSCRIPTION_FOUND));
    }

    return subscription;
  }

  /**
   * Handles both new subscriptions AND plan changes.
   *
   * - No active subscription → Stripe Checkout (new subscription)
   * - Active subscription, different price → Stripe subscription update (plan change)
   * - Active subscription, cancel pending → Reactivate (undo cancel)
   */
  async createCheckoutSession(
    practiceId: string,
    priceId: string,
    email: string,
  ) {
    // Validate the price ID against known plans
    const validPriceIds = await this.getValidPriceIds();
    if (!validPriceIds.includes(priceId)) {
      throw new BadRequestException(errorPayload(ErrorCode.INVALID_PRICE_ID));
    }

    let subscription = await this.prisma.subscription.findUnique({
      where: { practiceId },
    });

    if (!subscription) {
      throw new NotFoundException(errorPayload(ErrorCode.NO_SUBSCRIPTION_FOUND));
    }

    const stripe = await this.getStripe();
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    // ── Case 1: Active subscription with cancel pending → reactivate ──
    if (
      subscription.stripeSubscriptionId &&
      subscription.status === 'ACTIVE' &&
      subscription.cancelAtPeriodEnd
    ) {
      // Undo the cancellation — Stripe will continue billing
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      // The webhook will update our DB, but also update immediately for fast UI feedback
      await this.prisma.subscription.update({
        where: { practiceId },
        data: { cancelAtPeriodEnd: false },
      });

      this.logger.log(`Reactivated subscription ${subscription.stripeSubscriptionId} for practice ${practiceId}`);
      return { url: `${frontendUrl}/billing?success=true`, action: 'reactivated' };
    }

    // ── Case 2: Active subscription → plan change (upgrade/downgrade) ──
    if (
      subscription.stripeSubscriptionId &&
      (subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE')
    ) {
      // Retrieve the current subscription to get the subscription item ID
      const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      const currentItem = stripeSub.items.data[0];

      if (!currentItem) {
        throw new ServiceUnavailableException('Could not find subscription item');
      }

      // If already on this price, no-op
      if (currentItem.price.id === priceId) {
        return { url: `${frontendUrl}/billing`, action: 'no_change' };
      }

      // Update the subscription item to the new price
      // proration_behavior: 'create_prorations' gives the user credit for unused time
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [{
          id: currentItem.id,
          price: priceId,
        }],
        proration_behavior: 'create_prorations',
        metadata: { practiceId },
      });

      this.logger.log(
        `Plan change for practice ${practiceId}: ${currentItem.price.id} → ${priceId}`,
      );

      // Webhook will update the DB with the new plan
      return { url: `${frontendUrl}/billing?success=true`, action: 'plan_changed' };
    }

    // ── Case 3: No active subscription → new Stripe Checkout ──
    // (FREE_TRIAL, CANCELLED, EXPIRED)

    // Create Stripe customer if not exists
    if (!subscription.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { practiceId },
      });

      subscription = await this.prisma.subscription.update({
        where: { practiceId },
        data: { stripeCustomerId: customer.id },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: subscription.stripeCustomerId!,
      customer_update: { address: 'auto', name: 'auto' },
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/billing?success=true`,
      cancel_url: `${frontendUrl}/billing?cancelled=true`,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      subscription_data: {
        metadata: { practiceId },
      },
      metadata: { practiceId },
    });

    return { url: session.url, action: 'checkout' };
  }

  async createPortalSession(practiceId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { practiceId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new NotFoundException(errorPayload(ErrorCode.NO_STRIPE_CUSTOMER));
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const stripe = await this.getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${frontendUrl}/billing`,
    });

    return { url: session.url };
  }

  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const practiceId = sub.metadata.practiceId;
        if (!practiceId) break;

        const plan = await this.mapPriceToplan(
          (sub.items.data[0]?.price.id) ?? '',
        );

        // In Stripe API 2026+, current_period_end was removed.
        // Use billing_cycle_anchor + 1 interval as an approximation.
        const periodEnd = (sub as any).current_period_end
          ? new Date((sub as any).current_period_end * 1000)
          : sub.billing_cycle_anchor
            ? new Date(sub.billing_cycle_anchor * 1000 + 30 * 24 * 60 * 60 * 1000)
            : null;

        const periodStart = (sub as any).current_period_start
          ? new Date((sub as any).current_period_start * 1000)
          : sub.billing_cycle_anchor
            ? new Date(sub.billing_cycle_anchor * 1000)
            : null;

        const trialEnd = sub.trial_end
          ? new Date(sub.trial_end * 1000)
          : null;

        await this.prisma.subscription.update({
          where: { practiceId },
          data: {
            stripeSubscriptionId: sub.id,
            status: this.mapStripeStatus(sub.status),
            plan,
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
            ...(periodStart && { currentPeriodStart: periodStart }),
            ...(periodEnd && { currentPeriodEnd: periodEnd }),
            ...(trialEnd && { trialEndsAt: trialEnd }),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const practiceId = sub.metadata.practiceId;
        if (!practiceId) break;

        const periodEnd = (sub as any).current_period_end
          ? new Date((sub as any).current_period_end * 1000)
          : sub.billing_cycle_anchor
            ? new Date(sub.billing_cycle_anchor * 1000 + 30 * 24 * 60 * 60 * 1000)
            : null;

        await this.prisma.subscription.update({
          where: { practiceId },
          data: {
            status: 'CANCELLED',
            stripeSubscriptionId: null,
            cancelAtPeriodEnd: false,
            ...(periodEnd && { currentPeriodEnd: periodEnd }),
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.toString();
        if (!customerId) break;

        await this.prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: { status: 'PAST_DUE' },
        });
        break;
      }
    }
  }

  private mapStripeStatus(status: string): 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' {
    switch (status) {
      case 'trialing': return 'TRIALING';
      case 'active': return 'ACTIVE';
      case 'past_due': return 'PAST_DUE';
      case 'canceled': return 'CANCELLED';
      default: return 'EXPIRED';
    }
  }

  private async mapPriceToplan(priceId: string): Promise<'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'> {
    const starterMonthly = await this.platformConfig.get('stripe.starterMonthlyPriceId');
    const starterYearly = await this.platformConfig.get('stripe.starterYearlyPriceId');
    const proMonthly = await this.platformConfig.get('stripe.professionalMonthlyPriceId');
    const proYearly = await this.platformConfig.get('stripe.professionalYearlyPriceId');
    const enterpriseMonthly = await this.platformConfig.get('stripe.enterpriseMonthlyPriceId');
    const enterpriseYearly = await this.platformConfig.get('stripe.enterpriseYearlyPriceId');

    if (priceId === starterMonthly || priceId === starterYearly) return 'STARTER';
    if (priceId === proMonthly || priceId === proYearly) return 'PROFESSIONAL';
    if (priceId === enterpriseMonthly || priceId === enterpriseYearly) return 'ENTERPRISE';

    this.logger.error(`Unknown Stripe price ID: ${priceId} — rejecting`);
    throw new Error(`Unknown Stripe price ID: ${priceId}`);
  }

  private async getValidPriceIds(): Promise<string[]> {
    const keys = [
      'stripe.starterMonthlyPriceId', 'stripe.starterYearlyPriceId',
      'stripe.professionalMonthlyPriceId', 'stripe.professionalYearlyPriceId',
      'stripe.enterpriseMonthlyPriceId', 'stripe.enterpriseYearlyPriceId',
    ];
    const values = await Promise.all(keys.map((k) => this.platformConfig.get(k)));
    return values.filter((v): v is string => !!v);
  }

  async constructWebhookEvent(payload: Buffer, signature: string): Promise<Stripe.Event> {
    const secret = await this.platformConfig.get('stripe.subscriptionWebhookSecret');
    if (!secret) {
      throw new ServiceUnavailableException(
        'Billing webhooks are not configured. Set stripe.subscriptionWebhookSecret in Admin → Settings.',
      );
    }
    const stripe = await this.getStripe();
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
