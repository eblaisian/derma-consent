import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SubscriptionGuard } from '../billing/subscription.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('api/analytics')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles('ADMIN')
  getOverview(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getOverview(user.practiceId!);
  }

  @Get('by-type')
  @Roles('ADMIN')
  getByType(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getByType(user.practiceId!);
  }

  @Get('by-period')
  @Roles('ADMIN')
  getByPeriod(
    @CurrentUser() user: CurrentUserPayload,
    @Query('days') days?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getByPeriod(
      user.practiceId!,
      days ? parseInt(days, 10) : undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('conversion')
  @Roles('ADMIN')
  getConversion(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getConversion(user.practiceId!);
  }

  @Get('revenue')
  @Roles('ADMIN')
  getRevenue(
    @CurrentUser() user: CurrentUserPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getRevenue(
      user.practiceId!,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('retention-flags')
  @Roles('ADMIN')
  getRetentionFlags(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getRetentionFlags(user.practiceId!);
  }

  @Get('insights')
  @Roles('ADMIN')
  getInsights(
    @CurrentUser() user: CurrentUserPayload,
    @Query('locale') locale?: string,
  ) {
    return this.analyticsService.generateInsights(user.practiceId!, locale || 'de');
  }
}
