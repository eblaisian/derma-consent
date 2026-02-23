import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('api/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles('ADMIN', 'ARZT')
  getOverview(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getOverview(user.practiceId!);
  }

  @Get('by-type')
  @Roles('ADMIN', 'ARZT')
  getByType(@CurrentUser() user: CurrentUserPayload) {
    return this.analyticsService.getByType(user.practiceId!);
  }

  @Get('by-period')
  @Roles('ADMIN', 'ARZT')
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
  @Roles('ADMIN', 'ARZT')
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
}
