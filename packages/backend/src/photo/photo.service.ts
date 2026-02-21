import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UploadPhotoDto } from './photo.dto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

@Injectable()
export class PhotoService {
  private supabase: SupabaseClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_KEY');
    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  async upload(
    practiceId: string,
    userId: string,
    dto: UploadPhotoDto,
    fileBuffer: Buffer,
  ) {
    // Verify patient belongs to practice
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, practiceId },
    });
    if (!patient) {
      throw new NotFoundException('Patient nicht gefunden');
    }

    let storagePath: string;

    if (this.supabase) {
      storagePath = `encrypted-photos/${practiceId}/${dto.patientId}/${randomUUID()}.enc`;
      const { error } = await this.supabase.storage
        .from('encrypted-photos')
        .upload(storagePath, fileBuffer, {
          contentType: 'application/octet-stream',
        });
      if (error) throw error;
    } else {
      // Dev fallback: store as data URI
      storagePath = `data:application/octet-stream;base64,${fileBuffer.toString('base64')}`;
    }

    const photo = await this.prisma.treatmentPhoto.create({
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
    options: { type?: string; bodyRegion?: string; page?: number; limit?: number } = {},
  ) {
    const { type, bodyRegion, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { practiceId, patientId };
    if (type) where.type = type;
    if (bodyRegion) where.bodyRegion = bodyRegion;

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
      throw new NotFoundException('Foto nicht gefunden');
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

    if (this.supabase) {
      const { data, error } = await this.supabase.storage
        .from('encrypted-photos')
        .download(photo.storagePath);
      if (error || !data) throw error || new Error('Download failed');
      return Buffer.from(await data.arrayBuffer());
    }

    // Dev fallback: decode data URI
    const base64 = photo.storagePath.split(',')[1];
    return Buffer.from(base64, 'base64');
  }

  async delete(practiceId: string, userId: string, id: string) {
    const photo = await this.findById(practiceId, id);

    if (this.supabase && !photo.storagePath.startsWith('data:')) {
      await this.supabase.storage
        .from('encrypted-photos')
        .remove([photo.storagePath]);
    }

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

    if (this.supabase) {
      const paths = photos
        .map((p) => p.storagePath)
        .filter((p) => !p.startsWith('data:'));
      if (paths.length > 0) {
        await this.supabase.storage.from('encrypted-photos').remove(paths);
      }
    }

    await this.prisma.treatmentPhoto.deleteMany({
      where: { patientId, practiceId },
    });
  }
}
