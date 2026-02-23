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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateConfigDto } from './dto/admin.dto';

@Controller('api/admin/config')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminConfigController {
  constructor(
    private readonly platformConfig: PlatformConfigService,
    private readonly auditService: AuditService,
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
}
