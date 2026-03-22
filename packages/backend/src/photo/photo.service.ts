import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { UploadPhotoDto } from './photo.dto';
import { ErrorCode, errorPayload } from '../common/error-codes';
import { randomUUID } from 'crypto';

@Injectable()
export class PhotoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async upload(
    practiceId: string,
    userId: string,
    dto: UploadPhotoDto,
    fileBuffer: Buffer,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, practiceId },
    });
    if (!patient) {
      throw new NotFoundException(errorPayload(ErrorCode.PATIENT_NOT_FOUND));
    }

    const path = `encrypted-photos/${practiceId}/${dto.patientId}/${randomUUID()}.enc`;
    const storagePath = await this.storage.uploadWithQuotaCheck(path, fileBuffer, 'application/octet-stream', practiceId);

    let photo;
    try {
      photo = await this.prisma.treatmentPhoto.create({
        data: {
          practiceId,
          patientId: dto.patientId,
          consentFormId: dto.consentFormId,
          treatmentPlanId: dto.treatmentPlanId,
          type: dto.type,
          bodyRegion: dto.bodyRegion,
          encryptedSessionKey: dto.encryptedSessionKey,
          storagePath,
          encryptedMetadata: dto.encryptedMetadata as object | undefined,
          photoConsentGranted: dto.photoConsentGranted ?? false,
          takenAt: new Date(dto.takenAt),
        },
      });
    } catch (error) {
      await this.storage.remove([storagePath]).catch(() => {});
      throw error;
    }

    await this.audit.log({
      practiceId,
      userId,
      action: 'PHOTO_UPLOADED',
      entityType: 'TreatmentPhoto',
      entityId: photo.id,
    });

    return photo;
  }

  async findByPatient(
    practiceId: string,
    patientId: string,
    options: { type?: string; bodyRegion?: string; treatmentPlanId?: string; page?: number; limit?: number } = {},
  ) {
    const { type, bodyRegion, treatmentPlanId, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { practiceId, patientId };
    if (type) where.type = type;
    if (bodyRegion) where.bodyRegion = bodyRegion;
    if (treatmentPlanId) where.treatmentPlanId = treatmentPlanId;

    const [items, total] = await Promise.all([
      this.prisma.treatmentPhoto.findMany({
        where,
        orderBy: { takenAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          bodyRegion: true,
          encryptedSessionKey: true,
          encryptedMetadata: true,
          photoConsentGranted: true,
          takenAt: true,
          createdAt: true,
          treatmentPlanId: true,
          consentFormId: true,
        },
      }),
      this.prisma.treatmentPhoto.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(practiceId: string, id: string) {
    const photo = await this.prisma.treatmentPhoto.findFirst({
      where: { id, practiceId },
    });
    if (!photo) {
      throw new NotFoundException(errorPayload(ErrorCode.PHOTO_NOT_FOUND));
    }
    return photo;
  }

  async download(practiceId: string, userId: string, id: string) {
    const photo = await this.findById(practiceId, id);

    await this.audit.log({
      practiceId,
      userId,
      action: 'PHOTO_VIEWED',
      entityType: 'TreatmentPhoto',
      entityId: id,
    });

    return this.storage.download(photo.storagePath);
  }

  async delete(practiceId: string, userId: string, id: string) {
    const photo = await this.findById(practiceId, id);

    await this.storage.remove([photo.storagePath]);
    await this.prisma.treatmentPhoto.delete({ where: { id } });

    await this.audit.log({
      practiceId,
      userId,
      action: 'PHOTO_DELETED',
      entityType: 'TreatmentPhoto',
      entityId: id,
    });

    return { success: true };
  }

  async updateConsent(practiceId: string, id: string, granted: boolean) {
    const photo = await this.findById(practiceId, id);
    return this.prisma.treatmentPhoto.update({
      where: { id: photo.id },
      data: { photoConsentGranted: granted },
    });
  }

  async deleteByPatient(practiceId: string, patientId: string) {
    const photos = await this.prisma.treatmentPhoto.findMany({
      where: { patientId, practiceId },
      select: { storagePath: true },
    });

    await this.storage.remove(photos.map((p) => p.storagePath));
    await this.prisma.treatmentPhoto.deleteMany({
      where: { patientId, practiceId },
    });
  }
}
