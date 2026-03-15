import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './settings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SubscriptionGuard } from '../billing/subscription.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { createClient } from '@supabase/supabase-js';

@Controller('api/settings')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@Roles('ADMIN')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  @Get()
  findByPractice(@CurrentUser() user: CurrentUserPayload) {
    return this.settingsService.findByPractice(user.practiceId!);
  }

  @Patch()
  update(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.settingsService.update(user.practiceId!, dto);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const maxSize = 10 * 1024 * 1024; // 10 MB
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10 MB limit');
    }
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, SVG');
    }

    const supabaseUrl = await this.platformConfig.get('storage.supabaseUrl');
    const supabaseKey = await this.platformConfig.get('storage.supabaseServiceKey');

    if (!supabaseUrl || !supabaseKey) {
      // Store as data URI in dev
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return this.settingsService.updateLogo(user.practiceId!, dataUri);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const path = `logos/${user.practiceId}/${Date.now()}-${file.originalname}`;

    const { error } = await supabase.storage
      .from('practice-assets')
      .upload(path, file.buffer, { contentType: file.mimetype });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('practice-assets')
      .getPublicUrl(path);

    return this.settingsService.updateLogo(user.practiceId!, urlData.publicUrl);
  }

  @Delete('logo')
  deleteLogo(@CurrentUser() user: CurrentUserPayload) {
    return this.settingsService.deleteLogo(user.practiceId!);
  }
}
