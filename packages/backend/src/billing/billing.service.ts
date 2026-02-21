import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
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

        const plan = this.mapPriceToplan(
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

  private mapPriceToplan(priceId: string): 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' {
    const starterMonthly = this.configService.get<string>('STRIPE_STARTER_MONTHLY_PRICE_ID');
    const starterYearly = this.configService.get<string>('STRIPE_STARTER_YEARLY_PRICE_ID');
    const proMonthly = this.configService.get<string>('STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID');
    const proYearly = this.configService.get<string>('STRIPE_PROFESSIONAL_YEARLY_PRICE_ID');

    if (priceId === starterMonthly || priceId === starterYearly) return 'STARTER';
    if (priceId === proMonthly || priceId === proYearly) return 'PROFESSIONAL';
    return 'PROFESSIONAL';
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const secret = this.configService.get<string>('STRIPE_SUBSCRIPTION_WEBHOOK_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException(
        'Billing webhooks are not configured. Set STRIPE_SUBSCRIPTION_WEBHOOK_SECRET in .env',
      );
    }
    return this.getStripe().webhooks.constructEvent(payload, signature, secret);
  }
}
