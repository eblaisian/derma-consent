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
import { StorageService } from '../storage/storage.service';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Controller('api/settings')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@Roles('ADMIN')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  async findByPractice(@CurrentUser() user: CurrentUserPayload) {
    const settings = await this.settingsService.findByPractice(user.practiceId!);

    // Resolve storage path to public URL at read time
    if (settings.logoUrl && !settings.logoUrl.startsWith('data:') && !settings.logoUrl.startsWith('http')) {
      const publicUrl = await this.storage.getPublicUrl(settings.logoUrl);
      // If storage can't resolve the path, return null rather than a raw path the browser can't render
      return { ...settings, logoUrl: publicUrl || null };
    }

    return settings;
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
    const maxSize = 10 * 1024 * 1024;

    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10 MB limit');
    }
    const ext = MIME_TO_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP');
    }

    // Delete old logo blob if exists
    const current = await this.settingsService.findByPractice(user.practiceId!);
    if (current.logoUrl && !current.logoUrl.startsWith('data:') && !current.logoUrl.startsWith('http')) {
      await this.storage.remove([current.logoUrl]).catch(() => {});
    }

    // Sanitized path — never use user-supplied filenames
    const path = `practice-assets/logos/${user.practiceId}/${Date.now()}.${ext}`;
    const storagePath = await this.storage.upload(path, file.buffer, file.mimetype, { acl: 'public-read' });

    // Store the raw storage path — resolve to public URL at read time
    return this.settingsService.updateLogo(user.practiceId!, storagePath);
  }

  @Delete('logo')
  async deleteLogo(@CurrentUser() user: CurrentUserPayload) {
    // Delete blob from storage
    const current = await this.settingsService.findByPractice(user.practiceId!);
    if (current.logoUrl && !current.logoUrl.startsWith('data:') && !current.logoUrl.startsWith('http')) {
      await this.storage.remove([current.logoUrl]).catch(() => {});
    }

    return this.settingsService.deleteLogo(user.practiceId!);
  }
}
