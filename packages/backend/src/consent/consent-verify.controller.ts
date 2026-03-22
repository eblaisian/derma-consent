import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode, errorPayload } from '../common/error-codes';

@Controller('api/verify')
export class ConsentVerifyController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async verify(@Param('id') id: string) {
    const consent = await this.prisma.consentForm.findUnique({
      where: { id },
      select: {
        type: true,
        status: true,
        signatureTimestamp: true,
        pdfSignatureHash: true,
        practice: { select: { name: true } },
      },
    });

    if (!consent) {
      throw new NotFoundException(errorPayload(ErrorCode.CONSENT_NOT_FOUND));
    }

    return {
      practiceName: consent.practice.name,
      consentType: consent.type,
      dateSigned: consent.signatureTimestamp,
      status: consent.status,
      pdfSignatureHash: consent.pdfSignatureHash,
      isValid: !!consent.pdfSignatureHash,
    };
  }
}
