import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null;
  private readonly platformFeePercent: number;

  constructor(private readonly config: ConfigService) {
    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = stripeKey ? new Stripe(stripeKey) : null;
    this.platformFeePercent = parseInt(
      this.config.get('STRIPE_PLATFORM_FEE_PERCENT', '5'),
      10,
    );
  }

  private getStripe(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env');
    }
    return this.stripe;
  }

  async createCheckoutSession(params: {
    consentId: string;
    consentToken: string;
    practiceStripeConnectId: string;
    practiceName: string;
    consentType: string;
    amountCents: number;
  }): Promise<Stripe.Checkout.Session> {
    const frontendUrl =
      this.config.get('FRONTEND_URL') || 'http://localhost:3000';

    const applicationFee = Math.round(
      params.amountCents * (this.platformFeePercent / 100),
    );

    return this.getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Einwilligung: ${params.consentType}`,
              description: `${params.practiceName} - Behandlungseinwilligung`,
            },
            unit_amount: params.amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: params.practiceStripeConnectId,
        },
      },
      metadata: {
        consent_id: params.consentId,
        consent_token: params.consentToken,
      },
      success_url: `${frontendUrl}/consent/${params.consentToken}?status=success`,
      cancel_url: `${frontendUrl}/consent/${params.consentToken}?status=cancelled`,
    });
  }

  constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Stripe.Event {
    const webhookSecret = this.config.getOrThrow('STRIPE_WEBHOOK_SECRET');
    return this.getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
