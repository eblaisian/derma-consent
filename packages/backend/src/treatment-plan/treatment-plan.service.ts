import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateTreatmentPlanDto,
  UpdateTreatmentPlanDto,
  CreateTemplateDto,
  UpdateTemplateDto,
} from './treatment-plan.dto';

@Injectable()
export class TreatmentPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
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
      throw new NotFoundException('Patient nicht gefunden');
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
      throw new NotFoundException('Behandlungsplan nicht gefunden');
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
      throw new NotFoundException('Behandlungsplan nicht gefunden');
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
      throw new NotFoundException('Behandlungsplan nicht gefunden');
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
      throw new NotFoundException('Vorlage nicht gefunden');
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
      throw new NotFoundException('Vorlage nicht gefunden');
    }

    await this.prisma.treatmentTemplate.delete({ where: { id } });
    return { success: true };
  }
}
