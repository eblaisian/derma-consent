import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SyncUserDto } from './auth.dto';
import { RegisterDto, LoginDto } from './credentials.dto';
import { TwoFactorService } from './two-factor.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly twoFactorService: TwoFactorService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async syncUser(dto: SyncUserDto) {
    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          image: dto.image,
        },
      });
    } else {
      // Update name/image if provided
      if (dto.name || dto.image) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            ...(dto.name && { name: dto.name }),
            ...(dto.image && { image: dto.image }),
          },
        });
      }
    }

    // Upsert OAuth account
    await this.prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: dto.provider,
          providerAccountId: dto.providerAccountId,
        },
      },
      update: {
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        expiresAt: dto.expiresAt,
      },
      create: {
        userId: user.id,
        provider: dto.provider,
        providerAccountId: dto.providerAccountId,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        expiresAt: dto.expiresAt,
      },
    });

    return this.signAndReturn(user);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        emailVerified: false,
      },
    });

    // Send verification email
    const verifyToken = this.jwtService.sign(
      { sub: user.id, type: 'email-verify' },
      { expiresIn: '24h' },
    );
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verifyLink = `${frontendUrl}/verify-email?token=${verifyToken}`;
    await this.emailService.sendEmailVerification(user.email, verifyLink);

    return this.signAndReturn(user);
  }

  async loginWithCredentials(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account is locked. Try again in ${minutesLeft} minute(s).`,
      );
    }

    // Reset stale lockout counter if lockout period has expired
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      user.failedLoginAttempts = 0;
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_MINUTES = 15;

      const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
        failedLoginAttempts: attempts,
      };

      if (attempts >= MAX_ATTEMPTS) {
        updateData.lockedUntil = new Date(
          Date.now() + LOCKOUT_MINUTES * 60 * 1000,
        );
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      if (attempts >= MAX_ATTEMPTS) {
        await this.logAuthEvent(user, 'ACCOUNT_LOCKED');
        throw new UnauthorizedException(
          `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`,
        );
      }

      await this.logAuthEvent(user, 'LOGIN_FAILED');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    if (!user.emailVerified) {
      return { emailNotVerified: true, email: user.email };
    }

    if (user.twoFactorEnabled) {
      const tempToken = this.twoFactorService.createTempToken(user.id);
      return { requires2FA: true, tempToken };
    }

    await this.logAuthEvent(user, 'LOGIN_SUCCESS');
    return this.signAndReturn(user);
  }

  async verifyTwoFactorLogin(tempToken: string, token: string) {
    const userId = this.twoFactorService.verifyTempToken(tempToken);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.twoFactorSecret || !user.twoFactorEnabled) {
      throw new UnauthorizedException('2FA is not enabled for this user');
    }

    const isValid = this.twoFactorService.verifyToken(
      user.twoFactorSecret,
      token,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    return this.signAndReturn(user);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.passwordHash) {
      return { message: 'If an account exists, a reset link has been sent.' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    await this.emailService.sendPasswordReset(user.email, resetLink);

    return { message: 'If an account exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.type !== 'password-reset') {
      throw new BadRequestException('Invalid token type');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });

    return { message: 'Password has been reset successfully.' };
  }

  async verifyEmail(token: string) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (payload.type !== 'email-verify') {
      throw new BadRequestException('Invalid token type');
    }

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { emailVerified: true },
    });

    return { message: 'Email verified successfully.' };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.emailVerified) {
      return { message: 'If applicable, a verification email has been sent.' };
    }

    const verifyToken = this.jwtService.sign(
      { sub: user.id, type: 'email-verify' },
      { expiresIn: '24h' },
    );
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verifyLink = `${frontendUrl}/verify-email?token=${verifyToken}`;
    await this.emailService.sendEmailVerification(user.email, verifyLink);

    return { message: 'If applicable, a verification email has been sent.' };
  }

  /** GDPR Art. 15 — Export all personal data for a user */
  async exportAccountData(userId: string, practiceId: string | null) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: {
        provider: true,
        providerAccountId: true,
      },
    });

    let practiceData = null;
    let consentHistory: object[] = [];
    let auditLogs: object[] = [];

    if (practiceId) {
      practiceData = await this.prisma.practice.findUnique({
        where: { id: practiceId },
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      });

      consentHistory = await this.prisma.consentForm.findMany({
        where: { practiceId },
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          expiresAt: true,
          signatureTimestamp: true,
          revokedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });

      auditLogs = await this.prisma.auditLog.findMany({
        where: { userId },
        select: {
          action: true,
          entityType: true,
          entityId: true,
          ipAddress: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });
    }

    return {
      exportDate: new Date().toISOString(),
      format: 'GDPR Art. 15 Data Export',
      user,
      oauthProviders: accounts,
      practice: practiceData,
      consentHistory,
      auditLogs,
    };
  }

  private async logAuthEvent(
    user: { id: string; practiceId: string | null },
    action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'ACCOUNT_LOCKED',
  ) {
    try {
      await this.auditService.log({
        practiceId: user.practiceId || undefined,
        userId: user.id,
        action,
        entityType: 'User',
        entityId: user.id,
      });
    } catch {
      // Audit logging should never break auth flow
    }
  }

  private signAndReturn(user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    practiceId: string | null;
    role: string;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      practiceId: user.practiceId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        practiceId: user.practiceId,
        role: user.role,
      },
    };
  }
}
