import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePatientDto } from './patient.dto';
import { ErrorCode, errorPayload } from '../common/error-codes';

@Injectable()
export class PatientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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
      throw new NotFoundException(errorPayload(ErrorCode.PATIENT_NOT_FOUND));
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
      throw new NotFoundException(errorPayload(ErrorCode.PATIENT_NOT_FOUND));
    }

    return patient;
  }

  async delete(practiceId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, practiceId },
    });

    if (!patient) {
      throw new NotFoundException(errorPayload(ErrorCode.PATIENT_NOT_FOUND));
    }

    // DSGVO Art. 17 - Right to erasure
    // Collect all storage paths before deleting DB records
    const photos = await this.prisma.treatmentPhoto.findMany({
      where: { patientId: id },
      select: { storagePath: true },
    });
    const consents = await this.prisma.consentForm.findMany({
      where: { patientId: id, pdfStoragePath: { not: null } },
      select: { pdfStoragePath: true },
    });

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

    // Storage deletion after DB commit — if this fails, blobs are orphaned
    // but DB records are already gone (preferable for GDPR: no PII references remain)
    const allPaths = [
      ...photos.map((p) => p.storagePath),
      ...consents.map((c) => c.pdfStoragePath!),
    ];
    await this.storage.remove(allPaths);

    return { success: true };
  }
}
