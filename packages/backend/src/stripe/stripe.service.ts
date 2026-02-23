import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: Stripe | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  async onModuleInit() {
    const stripeKey = await this.platformConfig.get('stripe.secretKey');
    this.stripe = stripeKey ? new Stripe(stripeKey) : null;
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

    const platformFeePercent = parseInt(
      (await this.platformConfig.get('stripe.platformFeePercent')) || '5',
      10,
    );

    const applicationFee = Math.round(
      params.amountCents * (platformFeePercent / 100),
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

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.getStripe().paymentIntents.retrieve(paymentIntentId);
  }

  async constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    const webhookSecret = await this.platformConfig.get('stripe.webhookSecret');
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }
    return this.getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
