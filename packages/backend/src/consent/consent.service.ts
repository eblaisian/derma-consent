import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SmsService } from '../sms/sms.service';
import { PdfService } from '../pdf/pdf.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { CreateConsentDto, SubmitConsentDto } from './consent.dto';
import { ConsentStatus } from '@prisma/client';

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
    private readonly pdfService: PdfService,
    private readonly platformConfig: PlatformConfigService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async create(dto: CreateConsentDto) {
    const practice = await this.prisma.practice.findUnique({
      where: { id: dto.practiceId },
    });

    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    // Enforce subscription consent limits
    const subscription = await this.prisma.subscription.findUnique({
      where: { practiceId: dto.practiceId },
    });

    if (subscription) {
      const plan = subscription.plan;
      let monthlyLimit: number | null = null;

      const limitKey = `plans.${plan === 'FREE_TRIAL' ? 'freeTrialLimit' : plan === 'STARTER' ? 'starterLimit' : plan === 'PROFESSIONAL' ? 'professionalLimit' : 'enterpriseLimit'}`;
      const limitValue = parseInt((await this.platformConfig.get(limitKey)) || '-1', 10);
      if (limitValue > 0) {
        monthlyLimit = limitValue;
      }
      // -1 = unlimited (null)

      if (monthlyLimit !== null) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyCount = await this.prisma.consentForm.count({
          where: {
            practiceId: dto.practiceId,
            createdAt: { gte: monthStart },
          },
        });

        if (monthlyCount >= monthlyLimit) {
          throw new ForbiddenException(
            `Monthly consent limit reached (${monthlyLimit}). Please upgrade your plan.`,
          );
        }
      }
    }

    // Consent link expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const consent = await this.prisma.consentForm.create({
      data: {
        practiceId: dto.practiceId!,
        patientId: dto.patientId,
        type: dto.type,
        expiresAt,
      },
      select: {
        id: true,
        token: true,
        type: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    const result = { ...consent, practiceName: practice.name };

    await this.auditService?.log({
      practiceId: dto.practiceId!,
      action: 'CONSENT_CREATED',
      entityType: 'ConsentForm',
      entityId: result.id,
    });

    // Deliver consent link via chosen channel
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const link = `${frontendUrl}/consent/${result.token}`;

    if (dto.deliveryChannel === 'sms' && dto.patientPhone) {
      await this.smsService.sendConsentLink(dto.patientPhone, 'sms', link, practice.name);
    } else if (dto.deliveryChannel === 'whatsapp' && dto.patientPhone) {
      await this.smsService.sendConsentLink(dto.patientPhone, 'whatsapp', link, practice.name);
    }
    // Email delivery is handled by the controller

    return result;
  }

  async findByToken(token: string) {
    const consent = await this.prisma.consentForm.findUnique({
      where: { token },
      include: {
        practice: {
          select: {
            id: true,
            name: true,
            publicKey: true,
          },
        },
      },
    });

    if (!consent) {
      throw new NotFoundException('Consent form not found');
    }

    if (consent.expiresAt < new Date()) {
      throw new BadRequestException('Consent link has expired');
    }

    if (consent.status === ConsentStatus.REVOKED) {
      throw new BadRequestException('Consent has been revoked');
    }

    const settings = await this.prisma.practiceSettings.findUnique({
      where: { practiceId: consent.practiceId },
      select: { brandColor: true, logoUrl: true, educationVideos: true },
    });

    const educationVideos = (settings?.educationVideos as Record<string, string> | null) ?? null;
    const videoUrl = educationVideos?.[consent.type] ?? null;

    return { ...consent, brandColor: settings?.brandColor ?? null, logoUrl: settings?.logoUrl ?? null, videoUrl };
  }

  async submit(token: string, dto: SubmitConsentDto, ip: string, userAgent: string) {
    const consent = await this.findByToken(token);

    if (consent.status !== ConsentStatus.PENDING) {
      throw new BadRequestException('Consent form has already been submitted');
    }

    const now = new Date();
    // Format timestamp in Europe/Berlin timezone
    const berlinTimestamp = new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin',
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(now);

    const updated = await this.prisma.consentForm.update({
      where: { id: consent.id },
      data: {
        status: ConsentStatus.SIGNED,
        encryptedResponses: dto.encryptedResponses as object,
        encryptedSessionKey: dto.encryptedSessionKey,
        signatureIp: ip,
        signatureTimestamp: now,
        signatureUserAgent: userAgent,
        ...(dto.comprehensionScore !== undefined && { comprehensionScore: dto.comprehensionScore }),
        ...(dto.comprehensionAnswers && { comprehensionAnswers: dto.comprehensionAnswers as object }),
      },
      select: {
        id: true,
        token: true,
        status: true,
        signatureTimestamp: true,
        practiceId: true,
      },
    });

    await this.auditService?.log({
      practiceId: updated.practiceId,
      action: 'CONSENT_SUBMITTED',
      entityType: 'ConsentForm',
      entityId: updated.id,
      ipAddress: ip,
    });

    // Generate PDF immediately if no payment is required
    const practice = await this.prisma.practice.findUnique({
      where: { id: updated.practiceId },
      select: { stripeConnectId: true },
    });

    const hasPayment = !!practice?.stripeConnectId;
    if (!hasPayment) {
      // No payment flow — generate PDF and complete immediately
      this.pdfService.generateConsentPdf(updated.id).catch((err) => {
        this.logger.error(`PDF generation failed for ${updated.id}: ${err.message}`);
      });
    }
    // If payment is required, PDF generation happens after Stripe webhook

    return updated;
  }

  /** DSGVO Art. 7(3) - Consent revocation */
  async revoke(token: string) {
    const consent = await this.prisma.consentForm.findUnique({
      where: { token },
    });

    if (!consent) {
      throw new NotFoundException('Consent form not found');
    }

    if (consent.status === ConsentStatus.REVOKED) {
      throw new BadRequestException('Consent has already been revoked');
    }

    const revoked = await this.prisma.consentForm.update({
      where: { id: consent.id },
      data: {
        status: ConsentStatus.REVOKED,
        revokedAt: new Date(),
      },
      select: {
        id: true,
        token: true,
        status: true,
        revokedAt: true,
        practiceId: true,
      },
    });

    await this.auditService?.log({
      practiceId: revoked.practiceId,
      action: 'CONSENT_REVOKED',
      entityType: 'ConsentForm',
      entityId: revoked.id,
    });

    return revoked;
  }

  async findByPractice(practiceId: string, page = 1, limit = 25) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.consentForm.findMany({
        where: { practiceId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          token: true,
          type: true,
          status: true,
          expiresAt: true,
          createdAt: true,
          signatureTimestamp: true,
        },
      }),
      this.prisma.consentForm.count({ where: { practiceId } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
