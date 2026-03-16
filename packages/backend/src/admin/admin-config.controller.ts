import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { AuditService } from '../audit/audit.service';
import { SmsService } from '../sms/sms.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateConfigDto } from './dto/admin.dto';

@Controller('api/admin/config')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@SkipThrottle()
export class AdminConfigController {
  constructor(
    private readonly platformConfig: PlatformConfigService,
    private readonly auditService: AuditService,
    private readonly smsService: SmsService,
  ) {}

  @Get()
  async listAll(@Query('category') category?: string) {
    return this.platformConfig.getAll(category);
  }

  @Get(':key')
  async getOne(@Param('key') key: string) {
    const value = await this.platformConfig.get(key);
    return { key, value: value ?? null };
  }

  @Put(':key')
  async setOne(
    @Param('key') key: string,
    @Body() body: UpdateConfigDto,
    @CurrentUser() user: { userId: string },
  ) {
    await this.platformConfig.set(key, body.value);

    await this.auditService.log({
      userId: user.userId,
      action: 'PLATFORM_CONFIG_UPDATED',
      entityType: 'PlatformConfig',
      entityId: key,
    });

    // Reinitialize SMS service when seven.io config changes
    if (key.startsWith('sms.')) {
      await this.smsService.reinitialize();
    }

    return { success: true };
  }

  @Delete(':key')
  async deleteOne(
    @Param('key') key: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.platformConfig.delete(key);

    await this.auditService.log({
      userId: user.userId,
      action: 'PLATFORM_CONFIG_UPDATED',
      entityType: 'PlatformConfig',
      entityId: key,
      metadata: { action: 'deleted' },
    });

    return { success: true };
  }

  @Post('test/:category')
  async testConnection(@Param('category') category: string) {
    return this.platformConfig.testConnection(category);
  }

  @Post('validate-all')
  async validateAll() {
    return this.platformConfig.validateAllServices();
  }
}
