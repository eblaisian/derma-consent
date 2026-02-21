import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePracticeDto } from './practice.dto';

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePracticeDto, userId: string) {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const practice = await this.prisma.practice.create({
      data: {
        name: dto.name,
        dsgvoContact: dto.dsgvoContact,
        publicKey: dto.publicKey as object,
        encryptedPrivKey: dto.encryptedPrivKey as object,
        subscription: {
          create: {
            plan: 'FREE_TRIAL',
            status: 'TRIALING',
            trialEndsAt,
          },
        },
        settings: {
          create: {},
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    // Link user to practice as ADMIN
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        practiceId: practice.id,
        role: 'ADMIN',
      },
    });

    return practice;
  }

  async findById(id: string) {
    const practice = await this.prisma.practice.findUnique({
      where: { id },
    });

    if (!practice) {
      throw new NotFoundException('Practice not found');
    }

    return practice;
  }
}
