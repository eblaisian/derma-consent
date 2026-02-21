import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './patient.dto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class PatientService {
  private supabase: SupabaseClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_KEY');
    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  async findAll(practiceId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.patient.findMany({
        where: { practiceId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          encryptedName: true,
          encryptedDob: true,
          encryptedEmail: true,
          lookupHash: true,
          createdAt: true,
        },
      }),
      this.prisma.patient.count({ where: { practiceId } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(practiceId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, practiceId },
      include: {
        consentForms: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            token: true,
            type: true,
            status: true,
            createdAt: true,
            signatureTimestamp: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient nicht gefunden');
    }

    return patient;
  }

  async create(practiceId: string, dto: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        practiceId,
        encryptedName: dto.encryptedName,
        encryptedDob: dto.encryptedDob,
        encryptedEmail: dto.encryptedEmail,
        lookupHash: dto.lookupHash,
      },
      select: {
        id: true,
        encryptedName: true,
        lookupHash: true,
        createdAt: true,
      },
    });
  }

  async findByLookupHash(practiceId: string, hash: string) {
    const patient = await this.prisma.patient.findUnique({
      where: {
        practiceId_lookupHash: {
          practiceId,
          lookupHash: hash,
        },
      },
      include: {
        consentForms: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            token: true,
            type: true,
            status: true,
            createdAt: true,
            signatureTimestamp: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient nicht gefunden');
    }

    return patient;
  }

  async delete(practiceId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, practiceId },
    });

    if (!patient) {
      throw new NotFoundException('Patient nicht gefunden');
    }

    // DSGVO Art. 17 - Right to erasure
    // Delete photo blobs from Supabase before the transaction
    const photos = await this.prisma.treatmentPhoto.findMany({
      where: { patientId: id },
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

    await this.prisma.$transaction([
      this.prisma.treatmentPhoto.deleteMany({
        where: { patientId: id },
      }),
      this.prisma.treatmentPlan.deleteMany({
        where: { patientId: id },
      }),
      this.prisma.consentForm.deleteMany({
        where: { patientId: id },
      }),
      this.prisma.patient.delete({
        where: { id },
      }),
    ]);

    return { success: true };
  }
}
