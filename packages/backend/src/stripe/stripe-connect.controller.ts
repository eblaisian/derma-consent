import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { StripeConnectService } from './stripe-connect.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('api/stripe/connect')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StripeConnectController {
  constructor(private readonly connectService: StripeConnectService) {}

  @Post('onboard')
  @Roles('ADMIN')
  onboard(@CurrentUser() user: CurrentUserPayload) {
    return this.connectService.createConnectAccount(
      user.practiceId!,
      user.email,
    );
  }

  @Get('status')
  @Roles('ADMIN')
  status(@CurrentUser() user: CurrentUserPayload) {
    return this.connectService.getAccountStatus(user.practiceId!);
  }

  @Post('dashboard-link')
  @Roles('ADMIN')
  dashboardLink(@CurrentUser() user: CurrentUserPayload) {
    return this.connectService.createDashboardLink(user.practiceId!);
  }
}
