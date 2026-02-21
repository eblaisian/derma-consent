import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './consent.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';

@Controller('api/consent')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  create(@Body() dto: CreateConsentDto, @CurrentUser() user: CurrentUserPayload) {
    return this.consentService.create({
      ...dto,
      practiceId: user.practiceId!,
    });
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
