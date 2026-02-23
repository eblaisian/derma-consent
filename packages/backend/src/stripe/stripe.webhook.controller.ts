import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { ConsentStatus } from '@prisma/client';

@Controller('api/stripe')
@SkipThrottle()
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    const event = await this.stripeService.constructWebhookEvent(rawBody, signature);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const consentId = session.metadata?.consent_id;

        if (!consentId) {
          this.logger.warn('Webhook: checkout.session.completed without consent_id');
          break;
        }

        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : null;

        let paymentAmountCents: number | null = null;
        if (paymentIntentId) {
          try {
            const pi = await this.stripeService.retrievePaymentIntent(paymentIntentId);
            paymentAmountCents = pi.amount ?? null;
          } catch (err) {
            this.logger.warn(`Failed to retrieve payment intent ${paymentIntentId}: ${err}`);
          }
        }

        await this.prisma.consentForm.update({
          where: { id: consentId },
          data: {
            status: ConsentStatus.PAID,
            stripeSessionId: session.id,
            stripePaymentIntent: paymentIntentId,
            paymentAmountCents,
          },
        });

        this.logger.log(`Consent ${consentId} marked as PAID (amount: ${paymentAmountCents})`);

        // Async PDF generation
        this.pdfService.generateConsentPdf(consentId).catch((err) => {
          this.logger.error(`PDF generation failed for ${consentId}: ${err.message}`);
        });
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}
