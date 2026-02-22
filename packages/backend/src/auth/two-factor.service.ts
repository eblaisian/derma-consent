import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });
    return { twoFactorEnabled: user.twoFactorEnabled };
  }

  async generateSetupSecret(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: 'DermaConsent',
      label: user.email,
      secret,
    });

    // Store secret temporarily (not yet enabled)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { secret, qrCodeDataUrl };
  }

  async enableTwoFactor(userId: string, token: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.twoFactorSecret) {
      throw new UnauthorizedException('2FA setup not initiated');
    }

    if (!this.verifyToken(user.twoFactorSecret, token)) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { enabled: true };
  }

  async disableTwoFactor(userId: string, token: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.twoFactorSecret || !user.twoFactorEnabled) {
      throw new UnauthorizedException('2FA is not enabled');
    }

    if (!this.verifyToken(user.twoFactorSecret, token)) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return { enabled: false };
  }

  verifyToken(secret: string, token: string): boolean {
    const result = verifySync({ token, secret });
    return result.valid;
  }

  createTempToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, type: '2fa-pending' },
      { expiresIn: '5m' },
    );
  }

  verifyTempToken(tempToken: string): string {
    try {
      const payload = this.jwtService.verify(tempToken);
      if (payload.type !== '2fa-pending') {
        throw new UnauthorizedException('Invalid token type');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired 2FA session');
    }
  }
}
