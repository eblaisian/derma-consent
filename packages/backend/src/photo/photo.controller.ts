import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { PhotoService } from './photo.service';
import { UploadPhotoDto, UpdatePhotoConsentDto } from './photo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SubscriptionGuard } from '../billing/subscription.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';

@Controller('api/photos')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@Roles('ADMIN', 'ARZT')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadPhotoDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const maxSize = 10 * 1024 * 1024; // 10 MB
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10 MB limit');
    }
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: JPEG, PNG, WebP, HEIC');
    }

    return this.photoService.upload(
      user.practiceId!,
      user.userId,
      dto,
      file.buffer,
    );
  }

  @Get('patient/:patientId')
  findByPatient(
    @Param('patientId') patientId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query() pagination: PaginationDto,
    @Query('type') type?: string,
    @Query('bodyRegion') bodyRegion?: string,
  ) {
    return this.photoService.findByPatient(user.practiceId!, patientId, {
      type,
      bodyRegion,
      page: pagination.page,
      limit: pagination.limit,
    });
  }

  @Get(':id')
  findById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.photoService.findById(user.practiceId!, id);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const buffer = await this.photoService.download(
      user.practiceId!,
      user.userId,
      id,
    );
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${id}.enc"`,
    });
    res.send(buffer);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.photoService.delete(user.practiceId!, user.userId, id);
  }

  @Patch(':id/consent')
  updateConsent(
    @Param('id') id: string,
    @Body() dto: UpdatePhotoConsentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.photoService.updateConsent(
      user.practiceId!,
      id,
      dto.photoConsentGranted,
    );
  }
}
