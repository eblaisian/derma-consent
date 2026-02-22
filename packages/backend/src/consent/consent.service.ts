import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SmsService } from '../sms/sms.service';
import { CreateConsentDto, SubmitConsentDto } from './consent.dto';
import { ConsentStatus } from '@prisma/client';

@Injectable()
export class ConsentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async create(dto: CreateConsentDto) {
    const practice = await this.prisma.practice.findUnique({
      where: { id: dto.practiceId },
    });

    if (!practice) {
      throw new NotFoundException('Practice not found');
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

    await this.auditService?.log({
      practiceId: dto.practiceId!,
      action: 'CONSENT_CREATED',
      entityType: 'ConsentForm',
      entityId: consent.id,
    });

    // Deliver consent link via chosen channel
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const link = `${frontendUrl}/consent/${consent.token}`;

    if (dto.deliveryChannel === 'sms' && dto.patientPhone) {
      await this.smsService.sendConsentLink(dto.patientPhone, 'sms', link, practice.name);
    } else if (dto.deliveryChannel === 'whatsapp' && dto.patientPhone) {
      await this.smsService.sendConsentLink(dto.patientPhone, 'whatsapp', link, practice.name);
    }
    // Email delivery is handled by the controller/email service separately

    return consent;
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
