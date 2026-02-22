import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPractice(practiceId: string) {
    let settings = await this.prisma.practiceSettings.findUnique({
      where: { practiceId },
    });

    if (!settings) {
      settings = await this.prisma.practiceSettings.create({
        data: { practiceId },
      });
    }

    return settings;
  }

  async update(practiceId: string, dto: UpdateSettingsDto) {
    return this.prisma.practiceSettings.upsert({
      where: { practiceId },
      update: {
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.defaultConsentExpiry !== undefined && { defaultConsentExpiry: dto.defaultConsentExpiry }),
        ...(dto.enabledConsentTypes !== undefined && { enabledConsentTypes: dto.enabledConsentTypes }),
        ...(dto.brandColor !== undefined && { brandColor: dto.brandColor }),
        ...(dto.educationVideos !== undefined && { educationVideos: dto.educationVideos }),
      },
      create: {
        practiceId,
        ...(dto.logoUrl && { logoUrl: dto.logoUrl }),
        ...(dto.defaultConsentExpiry && { defaultConsentExpiry: dto.defaultConsentExpiry }),
        ...(dto.enabledConsentTypes && { enabledConsentTypes: dto.enabledConsentTypes }),
        ...(dto.brandColor && { brandColor: dto.brandColor }),
        ...(dto.educationVideos && { educationVideos: dto.educationVideos }),
      },
    });
  }

  async updateLogo(practiceId: string, logoUrl: string) {
    return this.prisma.practiceSettings.upsert({
      where: { practiceId },
      update: { logoUrl },
      create: { practiceId, logoUrl },
    });
  }

  async deleteLogo(practiceId: string) {
    const settings = await this.prisma.practiceSettings.findUnique({
      where: { practiceId },
    });

    if (!settings) {
      throw new NotFoundException('Settings not found');
    }

    return this.prisma.practiceSettings.update({
      where: { practiceId },
      data: { logoUrl: null },
    });
  }
}
