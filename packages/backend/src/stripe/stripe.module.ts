import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe.webhook.controller';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  providers: [StripeService],
  controllers: [StripeWebhookController],
  exports: [StripeService],
})
export class StripeModule {}
