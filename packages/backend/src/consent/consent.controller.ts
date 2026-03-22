import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  BadRequestException,
  NotFoundException,
  StreamableFile,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConsentService } from './consent.service';
import { CreateConsentDto, SendConsentCopyDto } from './consent.dto';
import { GeneratePdfDto } from '../pdf/pdf.dto';
import { NotificationService } from '../notifications/notification.service';
import { PdfService } from '../pdf/pdf.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SubscriptionGuard } from '../billing/subscription.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';
import { ErrorCode, errorPayload } from '../common/error-codes';
import { ConsentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/consent')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
export class ConsentController {
  constructor(
    private readonly consentService: ConsentService,
    private readonly notificationService: NotificationService,
    private readonly pdfService: PdfService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
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

  @Post(':id/generate-pdf')
  @Roles('ADMIN', 'ARZT')
  async generatePdf(
    @Param('id') id: string,
    @Body() dto: GeneratePdfDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // Verify consent belongs to this practice and is in a valid state
    const consent = await this.prisma.consentForm.findFirst({
      where: { id, practiceId: user.practiceId! },
      select: { id: true, status: true },
    });

    if (!consent) {
      throw new NotFoundException(errorPayload(ErrorCode.CONSENT_NOT_FOUND));
    }

    const validStatuses: ConsentStatus[] = [
      ConsentStatus.SIGNED,
      ConsentStatus.PAID,
      ConsentStatus.COMPLETED,
    ];
    if (!validStatuses.includes(consent.status)) {
      throw new BadRequestException(
        errorPayload(ErrorCode.PDF_GENERATION_FAILED, `Cannot generate PDF for consent in ${consent.status} status`),
      );
    }

    await this.pdfService.generateConsentPdf(id, dto, user.userId);

    await this.auditService.log({
      practiceId: user.practiceId!,
      userId: user.userId,
      action: 'PDF_GENERATED',
      entityType: 'ConsentForm',
      entityId: id,
    });

    // Auto-send to patient if email provided
    if (dto.patientEmail) {
      try {
        await this.sendCopy(id, { recipientEmail: dto.patientEmail, locale: dto.locale }, user);
      } catch {
        // Non-blocking — PDF was generated successfully, email send is best-effort
      }
    }

    return { success: true };
  }

  @Get(':id/pdf')
  @Roles('ADMIN', 'ARZT')
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.pdfService.downloadPdf(id, user.practiceId!);

    await this.auditService.log({
      practiceId: user.practiceId!,
      userId: user.userId,
      action: 'PDF_DOWNLOADED',
      entityType: 'ConsentForm',
      entityId: id,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post(':id/send-copy')
  @Roles('ADMIN', 'ARZT')
  async sendCopy(
    @Param('id') id: string,
    @Body() dto: SendConsentCopyDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const consent = await this.prisma.consentForm.findFirst({
      where: { id, practiceId: user.practiceId! },
      select: { id: true, status: true, type: true, locale: true, pdfStoragePath: true, signatureTimestamp: true, practice: { select: { name: true, dsgvoContact: true, settings: { select: { brandColor: true } } } } },
    });

    if (!consent) {
      throw new NotFoundException(errorPayload(ErrorCode.CONSENT_NOT_FOUND));
    }

    if (consent.status !== ConsentStatus.COMPLETED || !consent.pdfStoragePath) {
      throw new BadRequestException(
        errorPayload(ErrorCode.PDF_NOT_FOUND, 'PDF must be generated before sending'),
      );
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify/${consent.id}`;
    const locale = (dto.locale || consent.locale || 'de') as import('@derma-consent/shared').Locale;

    // Import and use the email template
    const { consentCompletedTemplate, getConsentCompletedSubject } = await import('../email/templates/consent-completed.template');
    const { stripHtmlToText } = await import('../email/templates/base-layout');

    const treatmentType = consent.type;
    const practiceName = consent.practice.name;
    const brandColor = consent.practice.settings?.brandColor || undefined;

    const html = consentCompletedTemplate(practiceName, treatmentType, verifyUrl, locale as import('../email/templates/types').EmailLocale, brandColor);
    const subject = getConsentCompletedSubject(practiceName, locale as import('../email/templates/types').EmailLocale);

    // Send via notification service
    await this.notificationService.sendCustomMessage({
      practiceId: user.practiceId!,
      channel: 'email',
      recipientEmail: dto.recipientEmail,
      subject,
      message: html,
      isHtml: true,
      userId: user.userId,
      locale,
    });

    // Update consent with send info
    await this.prisma.consentForm.update({
      where: { id },
      data: { pdfSentAt: new Date(), pdfSentTo: dto.recipientEmail },
    });

    await this.auditService.log({
      practiceId: user.practiceId!,
      userId: user.userId,
      action: 'CONSENT_COPY_SENT',
      entityType: 'ConsentForm',
      entityId: id,
      metadata: { recipientEmail: dto.recipientEmail },
    });

    return { success: true, sentAt: new Date() };
  }

  @Patch(':token/revoke')
  @Roles('ADMIN', 'ARZT')
  revoke(@Param('token') token: string) {
    return this.consentService.revoke(token);
  }
}
