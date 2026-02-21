import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './billing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('api/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @Roles('ADMIN')
  getSubscription(@CurrentUser() user: CurrentUserPayload) {
    return this.billingService.getSubscription(user.practiceId!);
  }

  @Post('checkout')
  @Roles('ADMIN')
  createCheckout(
    @Body() dto: CreateCheckoutDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.billingService.createCheckoutSession(
      user.practiceId!,
      dto.priceId,
      user.email,
    );
  }

  @Post('portal')
  @Roles('ADMIN')
  createPortal(@CurrentUser() user: CurrentUserPayload) {
    return this.billingService.createPortalSession(user.practiceId!);
  }
}
