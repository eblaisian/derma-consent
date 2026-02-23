import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './consent.dto';
import { EmailService } from '../email/email.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';

@Controller('api/consent')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentController {
  private readonly logger = new Logger(ConsentController.name);

  constructor(
    private readonly consentService: ConsentService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  async create(@Body() dto: CreateConsentDto, @CurrentUser() user: CurrentUserPayload) {
    const consent = await this.consentService.create({
      ...dto,
      practiceId: user.practiceId!,
    });

    // Send email if delivery channel is email
    if (dto.deliveryChannel === 'email' && dto.patientEmail) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const link = `${frontendUrl}/consent/${consent.token}`;
      this.emailService
        .sendConsentLink(dto.patientEmail, consent.practiceName, link, 7)
        .catch((err) => {
          this.logger.error(`Failed to send consent email: ${err}`);
        });
    }

    return consent;
  }

  @Get('practice')
  @Roles('ADMIN', 'ARZT')
  findByPractice(
    @CurrentUser() user: CurrentUserPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.consentService.findByPractice(
      user.practiceId!,
      pagination.page,
      pagination.limit,
    );
  }

  @Patch(':token/revoke')
  @Roles('ADMIN', 'ARZT')
  revoke(@Param('token') token: string) {
    return this.consentService.revoke(token);
  }
}
