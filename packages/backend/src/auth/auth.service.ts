import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SyncUserDto } from './auth.dto';
import { RegisterDto, LoginDto } from './credentials.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
      },
    });

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

    return this.signAndReturn(user);
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
