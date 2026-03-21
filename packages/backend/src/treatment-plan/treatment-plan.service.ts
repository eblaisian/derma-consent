import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AiService } from '../ai/ai.service';
import { NotificationService } from '../notifications/notification.service';
import { ErrorCode, errorPayload } from '../common/error-codes';
import {
  CreateTreatmentPlanDto,
  UpdateTreatmentPlanDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  GenerateAftercareDto,
  SendAftercareDto,
} from './treatment-plan.dto';

@Injectable()
export class TreatmentPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly ai: AiService,
    private readonly notifications: NotificationService,
  ) {}

  // --- Treatment Plans ---

  async createPlan(
    practiceId: string,
    userId: string,
    dto: CreateTreatmentPlanDto,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, practiceId },
    });
    if (!patient) {
      throw new NotFoundException(errorPayload(ErrorCode.PATIENT_NOT_FOUND));
    }

    const plan = await this.prisma.treatmentPlan.create({
      data: {
        practiceId,
        patientId: dto.patientId,
        consentFormId: dto.consentFormId,
        templateId: dto.templateId,
        type: dto.type,
        encryptedSessionKey: dto.encryptedSessionKey,
        encryptedData: dto.encryptedData as object,
        encryptedSummary: dto.encryptedSummary as object | undefined,
        performedAt: dto.performedAt ? new Date(dto.performedAt) : undefined,
      },
    });

    await this.audit.log({
      practiceId,
      userId,
      action: 'TREATMENT_PLAN_CREATED',
      entityType: 'TreatmentPlan',
      entityId: plan.id,
    });

    return plan;
  }

  async findPlansByPatient(
    practiceId: string,
    patientId: string,
    page = 1,
    limit = 50,
  ) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.treatmentPlan.findMany({
        where: { practiceId, patientId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          encryptedSessionKey: true,
          encryptedData: true,
          encryptedSummary: true,
          performedAt: true,
          createdAt: true,
          consentFormId: true,
          templateId: true,
        },
      }),
      this.prisma.treatmentPlan.count({ where: { practiceId, patientId } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPlanById(practiceId: string, userId: string, id: string) {
    const plan = await this.prisma.treatmentPlan.findFirst({
      where: { id, practiceId },
      include: {
        treatmentPhotos: {
          select: {
            id: true,
            type: true,
            bodyRegion: true,
            takenAt: true,
          },
        },
      },
    });
    if (!plan) {
      throw new NotFoundException(errorPayload(ErrorCode.TREATMENT_PLAN_NOT_FOUND));
    }

    await this.audit.log({
      practiceId,
      userId,
      action: 'TREATMENT_PLAN_VIEWED',
      entityType: 'TreatmentPlan',
      entityId: id,
    });

    return plan;
  }

  async updatePlan(
    practiceId: string,
    userId: string,
    id: string,
    dto: UpdateTreatmentPlanDto,
  ) {
    const plan = await this.prisma.treatmentPlan.findFirst({
      where: { id, practiceId },
    });
    if (!plan) {
      throw new NotFoundException(errorPayload(ErrorCode.TREATMENT_PLAN_NOT_FOUND));
    }

    const updated = await this.prisma.treatmentPlan.update({
      where: { id },
      data: {
        encryptedSessionKey: dto.encryptedSessionKey,
        encryptedData: dto.encryptedData as object | undefined,
        encryptedSummary: dto.encryptedSummary as object | undefined,
        performedAt: dto.performedAt ? new Date(dto.performedAt) : undefined,
      },
    });

    await this.audit.log({
      practiceId,
      userId,
      action: 'TREATMENT_PLAN_UPDATED',
      entityType: 'TreatmentPlan',
      entityId: id,
    });

    return updated;
  }

  async deletePlan(practiceId: string, id: string) {
    const plan = await this.prisma.treatmentPlan.findFirst({
      where: { id, practiceId },
    });
    if (!plan) {
      throw new NotFoundException(errorPayload(ErrorCode.TREATMENT_PLAN_NOT_FOUND));
    }

    await this.prisma.treatmentPlan.delete({ where: { id } });
    return { success: true };
  }

  // --- Templates ---

  async findTemplates(practiceId: string) {
    return this.prisma.treatmentTemplate.findMany({
      where: { practiceId },
      orderBy: { name: 'asc' },
    });
  }

  async createTemplate(practiceId: string, dto: CreateTemplateDto) {
    return this.prisma.treatmentTemplate.create({
      data: {
        practiceId,
        name: dto.name,
        type: dto.type,
        bodyRegion: dto.bodyRegion,
        templateData: dto.templateData as object,
      },
    });
  }

  async updateTemplate(practiceId: string, id: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.treatmentTemplate.findFirst({
      where: { id, practiceId },
    });
    if (!template) {
      throw new NotFoundException(errorPayload(ErrorCode.TREATMENT_TEMPLATE_NOT_FOUND));
    }

    return this.prisma.treatmentTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        bodyRegion: dto.bodyRegion,
        templateData: dto.templateData as object | undefined,
      },
    });
  }

  async deleteTemplate(practiceId: string, id: string) {
    const template = await this.prisma.treatmentTemplate.findFirst({
      where: { id, practiceId },
    });
    if (!template) {
      throw new NotFoundException(errorPayload(ErrorCode.TREATMENT_TEMPLATE_NOT_FOUND));
    }

    await this.prisma.treatmentTemplate.delete({ where: { id } });
    return { success: true };
  }

  // --- Aftercare Instructions ---

  private static readonly LOCALE_NAMES: Record<string, string> = {
    de: 'German', en: 'English', es: 'Spanish', fr: 'French',
    ar: 'Arabic', tr: 'Turkish', pl: 'Polish', ru: 'Russian',
  };

  async generateAftercare(
    practiceId: string,
    userId: string,
    dto: GenerateAftercareDto,
  ): Promise<{ content: string }> {
    const locale = dto.locale || 'de';
    const language = TreatmentPlanService.LOCALE_NAMES[locale] || 'German';
    const region = dto.bodyRegion ? ` on the ${dto.bodyRegion.toLowerCase().replace('_', ' ')}` : '';

    const content = await this.ai.chat([
      {
        role: 'system',
        content: [
          'You are a dermatology aftercare specialist at a German practice.',
          'Write practical, patient-friendly post-treatment instructions using markdown formatting.',
          'Structure with ## headings for sections (e.g., ## Immediate Care, ## What to Avoid, ## Expected Side Effects, ## When to Contact Your Doctor).',
          'Use numbered lists (1. 2. 3.) for step-by-step instructions within each section.',
          'Use **bold** for critical warnings or important terms.',
          'Keep it concise — 5-8 steps total across all sections.',
          `Respond entirely in ${language}. Use formal address.`,
        ].join(' '),
      },
      {
        role: 'user',
        content: `Generate aftercare instructions for: ${dto.type}${region} treatment.`,
      },
    ], { maxTokens: 600, temperature: 0.3 });

    await this.audit.log({
      practiceId,
      userId,
      action: 'TREATMENT_PLAN_CREATED',
      metadata: { subAction: 'aftercare_generated', type: dto.type, bodyRegion: dto.bodyRegion, locale },
    });

    return { content };
  }

  async sendAftercare(
    practiceId: string,
    userId: string,
    dto: SendAftercareDto,
  ): Promise<{ success: true }> {
    const channel = dto.channel as 'email' | 'sms' | 'whatsapp';

    if (channel === 'email' && !dto.recipientEmail) {
      throw new BadRequestException('recipientEmail is required for email channel');
    }
    if ((channel === 'sms' || channel === 'whatsapp') && !dto.recipientPhone) {
      throw new BadRequestException('recipientPhone is required for sms/whatsapp channel');
    }

    const practice = await this.prisma.practice.findUnique({ where: { id: practiceId }, select: { name: true } });

    await this.notifications.sendCustomMessage({
      practiceId,
      recipientEmail: dto.recipientEmail,
      recipientPhone: dto.recipientPhone,
      channel,
      subject: dto.subject,
      message: dto.htmlContent,
      isHtml: true,
      locale: dto.locale,
      userId,
      practiceName: practice?.name,
    });

    await this.audit.log({
      practiceId,
      userId,
      action: 'TREATMENT_PLAN_CREATED',
      metadata: { subAction: 'aftercare_sent', channel, locale: dto.locale },
    });

    return { success: true };
  }
}
