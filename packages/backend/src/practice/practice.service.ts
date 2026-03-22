import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePracticeDto } from './practice.dto';
import { UpdatePracticeDto } from './update-practice.dto';
import { ErrorCode, errorPayload } from '../common/error-codes';

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePracticeDto, userId: string) {
    // Prevent double-creation: user must not already belong to a practice
    const existingUser = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (existingUser.practiceId) {
      throw new BadRequestException(errorPayload(ErrorCode.USER_ALREADY_MEMBER));
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    return this.prisma.$transaction(async (tx) => {
      const practice = await tx.practice.create({
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

      await tx.user.update({
        where: { id: userId },
        data: {
          practiceId: practice.id,
          role: 'ADMIN',
        },
      });

      return practice;
    });
  }

  async update(practiceId: string, dto: UpdatePracticeDto) {
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId },
    });

    if (!practice) {
      throw new NotFoundException(errorPayload(ErrorCode.PRACTICE_NOT_FOUND));
    }

    const { name, dsgvoContact, street, houseNumber, postalCode, city, state, country, phone, practiceEmail, website } = dto;
    return this.prisma.practice.update({
      where: { id: practiceId },
      data: {
        ...(name !== undefined && { name }),
        ...(dsgvoContact !== undefined && { dsgvoContact }),
        ...(street !== undefined && { street }),
        ...(houseNumber !== undefined && { houseNumber }),
        ...(postalCode !== undefined && { postalCode }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(country !== undefined && { country }),
        ...(phone !== undefined && { phone }),
        ...(practiceEmail !== undefined && { practiceEmail }),
        ...(website !== undefined && { website }),
      },
    });
  }

  async rotateKey(practiceId: string, encryptedPrivKey: object) {
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId },
    });

    if (!practice) {
      throw new NotFoundException(errorPayload(ErrorCode.PRACTICE_NOT_FOUND));
    }

    return this.prisma.practice.update({
      where: { id: practiceId },
      data: { encryptedPrivKey },
      select: { id: true, updatedAt: true },
    });
  }

  async findById(id: string) {
    const practice = await this.prisma.practice.findUnique({
      where: { id },
    });

    if (!practice) {
      throw new NotFoundException(errorPayload(ErrorCode.PRACTICE_NOT_FOUND));
    }

    return practice;
  }
}
