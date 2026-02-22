import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SmsService } from '../sms/sms.service';
import { ConsentType } from './consent.dto';

describe('ConsentService', () => {
  let service: ConsentService;

  const mockPrisma = {
    practice: { findUnique: jest.fn() },
    consentForm: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    practiceSettings: {
      findUnique: jest.fn().mockResolvedValue({ brandColor: null, logoUrl: null }),
    },
  };

  const mockAudit = { log: jest.fn() };
  const mockConfig = { get: jest.fn().mockReturnValue('http://localhost:3000') };
  const mockSms = { sendConsentLink: jest.fn() };

  const mockPractice = { id: 'practice-1', name: 'Test Practice' };

  const mockConsent = {
    id: 'consent-1',
    token: 'abc-123-token',
    type: ConsentType.BOTOX,
    status: 'PENDING',
    practiceId: 'practice-1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    practice: { id: 'practice-1', name: 'Test Practice', publicKey: '{}' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: SmsService, useValue: mockSms },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<ConsentService>(ConsentService);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('should create consent with PENDING status and 7-day expiry', async () => {
      mockPrisma.practice.findUnique.mockResolvedValue(mockPractice);
      mockPrisma.consentForm.create.mockResolvedValue(mockConsent);

      const result = await service.create({
        practiceId: 'practice-1',
        type: ConsentType.BOTOX,
      });

      expect(result).toEqual(mockConsent);
      expect(mockPrisma.consentForm.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            practiceId: 'practice-1',
            type: ConsentType.BOTOX,
          }),
        }),
      );

      // Verify 7-day expiry was set
      const createCall = mockPrisma.consentForm.create.mock.calls[0][0];
      const expiresAt = createCall.data.expiresAt as Date;
      const now = new Date();
      const diffDays =
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(6.9);
      expect(diffDays).toBeLessThan(7.1);
    });

    it('should throw NotFoundException if practice does not exist', async () => {
      mockPrisma.practice.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ practiceId: 'nonexistent', type: ConsentType.BOTOX }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should log an audit event on creation', async () => {
      mockPrisma.practice.findUnique.mockResolvedValue(mockPractice);
      mockPrisma.consentForm.create.mockResolvedValue(mockConsent);

      await service.create({ practiceId: 'practice-1', type: ConsentType.BOTOX });

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CONSENT_CREATED',
          entityType: 'ConsentForm',
        }),
      );
    });
  });

  describe('findByToken()', () => {
    it('should return consent for valid, non-expired token', async () => {
      mockPrisma.consentForm.findUnique.mockResolvedValue(mockConsent);

      const result = await service.findByToken('abc-123-token');

      expect(result).toEqual({ ...mockConsent, brandColor: null, logoUrl: null, videoUrl: null });
    });

    it('should throw NotFoundException for non-existent token', async () => {
      mockPrisma.consentForm.findUnique.mockResolvedValue(null);

      await expect(service.findByToken('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      mockPrisma.consentForm.findUnique.mockResolvedValue({
        ...mockConsent,
        expiresAt: new Date('2020-01-01'),
      });

      await expect(service.findByToken('abc-123-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for revoked consent', async () => {
      mockPrisma.consentForm.findUnique.mockResolvedValue({
        ...mockConsent,
        status: 'REVOKED',
      });

      await expect(service.findByToken('abc-123-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('submit()', () => {
    it('should update status to SIGNED and store encrypted data', async () => {
      // Mock findByToken path
      mockPrisma.consentForm.findUnique.mockResolvedValue(mockConsent);
      mockPrisma.consentForm.update.mockResolvedValue({
        id: 'consent-1',
        token: 'abc-123-token',
        status: 'SIGNED',
        signatureTimestamp: new Date(),
        practiceId: 'practice-1',
      });

      const dto = {
        encryptedResponses: { data: 'encrypted' },
        encryptedSessionKey: 'session-key-encrypted',
        signatureData: 'data:image/png;base64,iVBOR...',
      };

      const result = await service.submit(
        'abc-123-token',
        dto,
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(result.status).toBe('SIGNED');
      expect(mockPrisma.consentForm.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SIGNED',
            encryptedResponses: dto.encryptedResponses,
            encryptedSessionKey: dto.encryptedSessionKey,
            signatureIp: '127.0.0.1',
            signatureUserAgent: 'Mozilla/5.0',
          }),
        }),
      );
    });

    it('should throw BadRequestException if already submitted', async () => {
      mockPrisma.consentForm.findUnique.mockResolvedValue({
        ...mockConsent,
        status: 'SIGNED',
      });

      await expect(
        service.submit(
          'abc-123-token',
          { encryptedResponses: {}, encryptedSessionKey: 'key', signatureData: 'data:image/png;base64,x' },
          '127.0.0.1',
          'Mozilla',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('revoke()', () => {
    it('should update status to REVOKED', async () => {
      mockPrisma.consentForm.findUnique.mockResolvedValue({
        ...mockConsent,
        status: 'SIGNED',
      });
      mockPrisma.consentForm.update.mockResolvedValue({
        id: 'consent-1',
        token: 'abc-123-token',
        status: 'REVOKED',
        revokedAt: new Date(),
        practiceId: 'practice-1',
      });

      const result = await service.revoke('abc-123-token');

      expect(result.status).toBe('REVOKED');
    });

    it('should log GDPR audit event on revocation', async () => {
      mockPrisma.consentForm.findUnique.mockResolvedValue({
        ...mockConsent,
        status: 'SIGNED',
      });
      mockPrisma.consentForm.update.mockResolvedValue({
        id: 'consent-1',
        token: 'abc-123-token',
        status: 'REVOKED',
        revokedAt: new Date(),
        practiceId: 'practice-1',
      });

      await service.revoke('abc-123-token');

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CONSENT_REVOKED',
          entityType: 'ConsentForm',
        }),
      );
    });

    it('should throw BadRequestException if already revoked', async () => {
      mockPrisma.consentForm.findUnique.mockResolvedValue({
        ...mockConsent,
        status: 'REVOKED',
      });

      await expect(service.revoke('abc-123-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
