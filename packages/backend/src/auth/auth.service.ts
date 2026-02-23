import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
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

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      return { emailNotVerified: true, email: user.email };
    }

    if (user.twoFactorEnabled) {
      const tempToken = this.twoFactorService.createTempToken(user.id);
      return { requires2FA: true, tempToken };
    }

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
