import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    practiceId: 'practice-1',
    role: 'ADMIN',
    passwordHash: null as string | null,
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    account: {
      upsert: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('should create user with hashed password and return JWT', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(async ({ data }) => ({
        ...mockUser,
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
      }));

      const result = await service.register({
        email: 'new@example.com',
        name: 'New User',
        password: 'SecurePass123',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('new@example.com');

      // Verify password was hashed, not stored in plain text
      const createdData = mockPrisma.user.create.mock.calls[0][0].data;
      expect(createdData.passwordHash).not.toBe('SecurePass123');
      const isMatch = await bcrypt.compare(
        'SecurePass123',
        createdData.passwordHash,
      );
      expect(isMatch).toBe(true);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'SecurePass123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('loginWithCredentials()', () => {
    it('should return JWT token for valid credentials', async () => {
      const hash = await bcrypt.hash('CorrectPassword', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
      });

      const result = await service.loginWithCredentials({
        email: 'test@example.com',
        password: 'CorrectPassword',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.id).toBe('user-1');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-1',
          email: 'test@example.com',
        }),
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('CorrectPassword', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
      });

      await expect(
        service.loginWithCredentials({
          email: 'test@example.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.loginWithCredentials({
          email: 'nobody@example.com',
          password: 'AnyPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for OAuth user without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });

      await expect(
        service.loginWithCredentials({
          email: 'test@example.com',
          password: 'AnyPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('syncUser()', () => {
    const oauthDto = {
      email: 'oauth@example.com',
      name: 'OAuth User',
      image: 'https://example.com/photo.jpg',
      provider: 'google',
      providerAccountId: 'google-123',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: 1234567890,
    };

    it('should create user and account for new OAuth user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        id: 'new-user',
        email: oauthDto.email,
        name: oauthDto.name,
      });
      mockPrisma.account.upsert.mockResolvedValue({});

      const result = await service.syncUser(oauthDto);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: oauthDto.email,
          name: oauthDto.name,
          image: oauthDto.image,
        },
      });
      expect(mockPrisma.account.upsert).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock-jwt-token');
    });

    it('should return existing user for already-synced OAuth user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.account.upsert.mockResolvedValue({});

      const result = await service.syncUser(oauthDto);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.id).toBe('user-1');
    });
  });
});
