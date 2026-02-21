import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PatientService } from './patient.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PatientService', () => {
  let service: PatientService;

  const mockPatient = {
    id: 'patient-1',
    practiceId: 'practice-1',
    encryptedName: 'enc-name',
    encryptedDob: 'enc-dob',
    encryptedEmail: 'enc-email',
    lookupHash: 'sha256-hash-abc',
    createdAt: new Date(),
  };

  const mockPrisma = {
    patient: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    consentForm: {
      deleteMany: jest.fn(),
    },
    treatmentPhoto: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    treatmentPlan: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callbacks: unknown[]) =>
      Promise.all((callbacks as Promise<unknown>[]).map((c) => c)),
    ),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('should create patient with encrypted fields and lookup hash', async () => {
      mockPrisma.patient.create.mockResolvedValue(mockPatient);

      const dto = {
        encryptedName: 'enc-name',
        encryptedDob: 'enc-dob',
        encryptedEmail: 'enc-email',
        lookupHash: 'sha256-hash-abc',
      };

      const result = await service.create('practice-1', dto);

      expect(result).toEqual(mockPatient);
      expect(mockPrisma.patient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            practiceId: 'practice-1',
            encryptedName: 'enc-name',
            lookupHash: 'sha256-hash-abc',
          }),
        }),
      );
    });
  });

  describe('findAll()', () => {
    it('should return paginated patients for a practice', async () => {
      const patients = [mockPatient];
      mockPrisma.patient.findMany.mockResolvedValue(patients);
      mockPrisma.patient.count.mockResolvedValue(1);

      const result = await service.findAll('practice-1', 1, 25);

      expect(result.items).toEqual(patients);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { practiceId: 'practice-1' },
          skip: 0,
          take: 25,
        }),
      );
    });

    it('should calculate correct offset for page 2', async () => {
      mockPrisma.patient.findMany.mockResolvedValue([]);
      mockPrisma.patient.count.mockResolvedValue(50);

      await service.findAll('practice-1', 2, 25);

      expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 25, take: 25 }),
      );
    });
  });

  describe('findById()', () => {
    it('should return patient with consent history', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({
        ...mockPatient,
        consentForms: [],
      });

      const result = await service.findById('practice-1', 'patient-1');

      expect(result.id).toBe('patient-1');
      expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'patient-1', practiceId: 'practice-1' },
        }),
      );
    });

    it('should throw NotFoundException for non-existent patient', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.findById('practice-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByLookupHash()', () => {
    it('should find patient by SHA-256 hash', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({
        ...mockPatient,
        consentForms: [],
      });

      const result = await service.findByLookupHash(
        'practice-1',
        'sha256-hash-abc',
      );

      expect(result.lookupHash).toBe('sha256-hash-abc');
    });

    it('should throw NotFoundException for non-existent hash', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      await expect(
        service.findByLookupHash('practice-1', 'nonexistent-hash'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete()', () => {
    it('should execute cascading delete in transaction', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrisma.treatmentPhoto.findMany.mockResolvedValue([]);

      await service.delete('practice-1', 'patient-1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const transactionOps = mockPrisma.$transaction.mock.calls[0][0];
      expect(transactionOps).toHaveLength(4); // photos, plans, consents, patient
    });

    it('should throw NotFoundException for non-existent patient', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.delete('practice-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
