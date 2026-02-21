import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { SubscriptionGuard } from './subscription.guard';

@Module({
  providers: [BillingService, SubscriptionGuard],
  controllers: [BillingController, BillingWebhookController],
  exports: [BillingService, SubscriptionGuard],
})
export class BillingModule {}
