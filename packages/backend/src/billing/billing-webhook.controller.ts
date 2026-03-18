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
import { BillingService } from './billing.service';
import { ErrorCode, errorPayload } from '../common/error-codes';

@Controller('api/billing')
@SkipThrottle()
export class BillingWebhookController {
  private readonly logger = new Logger(BillingWebhookController.name);

  constructor(private readonly billingService: BillingService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException(errorPayload(ErrorCode.MISSING_SIGNATURE_HEADER));
    }

    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      throw new BadRequestException(errorPayload(ErrorCode.MISSING_RAW_BODY));
    }

    let event;
    try {
      event = await this.billingService.constructWebhookEvent(rawBody, signature);
    } catch (err) {
      this.logger.error(`Webhook signature failed: ${(err as Error).message}`);
      throw new BadRequestException(errorPayload(ErrorCode.WEBHOOK_VERIFICATION_FAILED));
    }

    this.logger.log(`Billing webhook verified: ${event.type}`);
    await this.billingService.handleWebhookEvent(event);

    return { received: true };
  }
}
