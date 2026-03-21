import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CommunicationsService } from './communications.service';
import { GenerateDraftDto, SendMessageDto } from './communications.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SubscriptionGuard } from '../billing/subscription.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/communications')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
export class CommunicationsController {
  constructor(
    private readonly communicationsService: CommunicationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('draft')
  @Roles('ADMIN', 'ARZT', 'EMPFANG')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async generateDraft(
    @Body() dto: GenerateDraftDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const practice = await this.prisma.practice.findUnique({
      where: { id: user.practiceId! },
      select: { name: true },
    });

    return this.communicationsService.generateDraft(
      dto.context,
      dto.locale || 'de',
      practice?.name || 'Praxis',
    );
  }

  @Post('send')
  @Roles('ADMIN', 'ARZT', 'EMPFANG')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const practice = await this.prisma.practice.findUnique({
      where: { id: user.practiceId! },
      select: { name: true },
    });

    const subject = dto.subject || `${practice?.name || 'Praxis'} — Nachricht`;

    return this.communicationsService.sendMessage(
      user.practiceId!,
      dto.channel,
      dto.recipient,
      dto.message,
      subject,
      user.userId,
    );
  }
}
