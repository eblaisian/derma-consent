import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformConfigService } from './platform-config.service';

/**
 * Exposes non-secret feature flags to authenticated users.
 * Used by the frontend to conditionally show/hide features.
 */
@Controller('api/features')
@UseGuards(JwtAuthGuard)
export class FeatureFlagsController {
  constructor(private readonly platformConfig: PlatformConfigService) {}

  @Get()
  async getFeatureFlags() {
    const whatsappEnabled = await this.platformConfig.get('sms.whatsappEnabled');
    return {
      whatsappEnabled: whatsappEnabled === 'true',
    };
  }
}
