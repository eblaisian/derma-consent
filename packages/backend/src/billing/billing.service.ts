import { Injectable, Logger, NotFoundException, ServiceUnavailableException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService implements OnModuleInit {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  async onModuleInit() {
    const stripeKey = await this.platformConfig.get('stripe.secretKey');
    this.stripe = stripeKey ? new Stripe(stripeKey) : null;
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'Billing is not configured. Set STRIPE_SECRET_KEY in .env',
      );
    }
    return this.stripe;
  }

  async getSubscription(practiceId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { practiceId },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found');
    }

    return subscription;
  }

  async createCheckoutSession(
    practiceId: string,
    priceId: string,
    email: string,
  ) {
    let subscription = await this.prisma.subscription.findUnique({
      where: { practiceId },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found');
    }

    // Create Stripe customer if not exists
    if (!subscription.stripeCustomerId) {
      const customer = await this.getStripe().customers.create({
        email,
        metadata: { practiceId },
      });

      subscription = await this.prisma.subscription.update({
        where: { practiceId },
        data: { stripeCustomerId: customer.id },
      });
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const session = await this.getStripe().checkout.sessions.create({
      customer: subscription.stripeCustomerId!,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/billing?success=true`,
      cancel_url: `${frontendUrl}/billing?cancelled=true`,
      subscription_data: {
        metadata: { practiceId },
      },
      metadata: { practiceId },
    });

    return { url: session.url };
  }

  async createPortalSession(practiceId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { practiceId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new NotFoundException('No Stripe customer found');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const session = await this.getStripe().billingPortal.sessions.create({
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

        await this.prisma.subscription.update({
          where: { practiceId },
          data: {
            stripeSubscriptionId: sub.id,
            status: this.mapStripeStatus(sub.status),
            plan,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const practiceId = sub.metadata.practiceId;
        if (!practiceId) break;

        await this.prisma.subscription.update({
          where: { practiceId },
          data: {
            status: 'CANCELLED',
            stripeSubscriptionId: null,
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

    this.logger.warn(`Unknown Stripe price ID: ${priceId} — defaulting to PROFESSIONAL`);
    return 'PROFESSIONAL';
  }

  async constructWebhookEvent(payload: Buffer, signature: string): Promise<Stripe.Event> {
    const secret = await this.platformConfig.get('stripe.subscriptionWebhookSecret');
    if (!secret) {
      throw new ServiceUnavailableException(
        'Billing webhooks are not configured. Set STRIPE_SUBSCRIPTION_WEBHOOK_SECRET in .env',
      );
    }
    return this.getStripe().webhooks.constructEvent(payload, signature, secret);
  }
}
