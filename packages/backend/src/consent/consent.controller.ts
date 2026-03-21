import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './consent.dto';
import { NotificationService } from '../notifications/notification.service';
import { PdfService } from '../pdf/pdf.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SubscriptionGuard } from '../billing/subscription.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';

@Controller('api/consent')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
export class ConsentController {
  constructor(
    private readonly consentService: ConsentService,
    private readonly notificationService: NotificationService,
    private readonly pdfService: PdfService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  async create(@Body() dto: CreateConsentDto, @CurrentUser() user: CurrentUserPayload) {
    const consent = await this.consentService.create({
      ...dto,
      practiceId: user.practiceId!,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontendUrl}/consent/${consent.token}`;

    if (dto.deliveryChannel === 'email' && dto.patientEmail) {
      this.notificationService.sendConsentLink({
        practiceId: user.practiceId!,
        recipientEmail: dto.patientEmail,
        practiceName: consent.practiceName,
        consentLink: link,
        expiryDays: 7,
        userId: user.userId,
      }).catch(() => {});
    }

    return consent;
  }

  @Get('practice')
  @Roles('ADMIN', 'ARZT', 'EMPFANG')
  findByPractice(
    @CurrentUser() user: CurrentUserPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.consentService.findByPractice(
      user.practiceId!,
      pagination.page,
      pagination.limit,
    );
  }

  @Get(':id/pdf')
  @Roles('ADMIN', 'ARZT')
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.pdfService.downloadPdf(id, user.practiceId!);

    await this.auditService.log({
      practiceId: user.practiceId!,
      userId: user.userId,
      action: 'PDF_DOWNLOADED',
      entityType: 'ConsentForm',
      entityId: id,
    });

    return result;
  }

  @Patch(':token/revoke')
  @Roles('ADMIN', 'ARZT')
  revoke(@Param('token') token: string) {
    return this.consentService.revoke(token);
  }
}
