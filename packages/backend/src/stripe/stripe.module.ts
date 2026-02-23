import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeConnectService } from './stripe-connect.service';
import { StripeWebhookController } from './stripe.webhook.controller';
import { StripeConnectController } from './stripe-connect.controller';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  providers: [StripeService, StripeConnectService],
  controllers: [StripeWebhookController, StripeConnectController],
  exports: [StripeService, StripeConnectService],
})
export class StripeModule {}
