import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import Stripe from 'stripe';

@Injectable()
export class StripeConnectService {
  private readonly logger = new Logger(StripeConnectService.name);
  private stripe: Stripe | null = null;
  private stripeKeyHash: string | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  private async getStripe(): Promise<Stripe> {
    const stripeKey = await this.platformConfig.get('stripe.secretKey');
    if (!stripeKey) {
      throw new ServiceUnavailableException(
        'Stripe is not configured. Set stripe.secretKey in Admin → Settings.',
      );
    }
    if (!this.stripe || this.stripeKeyHash !== stripeKey) {
      this.stripe = new Stripe(stripeKey);
      this.stripeKeyHash = stripeKey;
    }
    return this.stripe;
  }

  async createConnectAccount(practiceId: string, email: string): Promise<{ url: string }> {
    const stripe = await this.getStripe();
    const practice = await this.prisma.practice.findUniqueOrThrow({
      where: { id: practiceId },
      select: { stripeConnectId: true, name: true },
    });

    let accountId = practice.stripeConnectId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        country: 'DE',
        business_type: 'company',
        metadata: { practiceId },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      await this.prisma.practice.update({
        where: { id: practiceId },
        data: { stripeConnectId: accountId },
      });

      this.logger.log(`Created Stripe Connect account ${accountId} for practice ${practiceId}`);
    }

    // Create account link for onboarding
    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:3000';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${frontendUrl}/billing?connect=refresh`,
      return_url: `${frontendUrl}/billing?connect=complete`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }

  async getAccountStatus(practiceId: string): Promise<{
    status: 'not_started' | 'pending' | 'active';
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    accountId: string | null;
  }> {
    const practice = await this.prisma.practice.findUniqueOrThrow({
      where: { id: practiceId },
      select: { stripeConnectId: true },
    });

    if (!practice.stripeConnectId) {
      return {
        status: 'not_started',
        chargesEnabled: false,
        payoutsEnabled: false,
        accountId: null,
      };
    }

    const stripe = await this.getStripe();
    const account = await stripe.accounts.retrieve(practice.stripeConnectId);

    const chargesEnabled = account.charges_enabled ?? false;
    const payoutsEnabled = account.payouts_enabled ?? false;

    return {
      status: chargesEnabled && payoutsEnabled ? 'active' : 'pending',
      chargesEnabled,
      payoutsEnabled,
      accountId: practice.stripeConnectId,
    };
  }

  async createDashboardLink(practiceId: string): Promise<{ url: string }> {
    const practice = await this.prisma.practice.findUniqueOrThrow({
      where: { id: practiceId },
      select: { stripeConnectId: true },
    });

    if (!practice.stripeConnectId) {
      throw new ServiceUnavailableException('Stripe Connect account not set up');
    }

    const stripe = await this.getStripe();
    const loginLink = await stripe.accounts.createLoginLink(
      practice.stripeConnectId,
    );

    return { url: loginLink.url };
  }

  async handleConnectWebhook(event: Stripe.Event) {
    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;
      const practiceId = account.metadata?.practiceId;

      if (practiceId) {
        this.logger.log(
          `Connect account ${account.id} updated: charges=${account.charges_enabled}, payouts=${account.payouts_enabled}`,
        );
      }
    }
  }
}
