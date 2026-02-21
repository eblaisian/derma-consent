import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './patient.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SubscriptionGuard } from '../billing/subscription.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';

@Controller('api/patients')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  @Roles('ADMIN', 'ARZT')
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.patientService.findAll(
      user.practiceId!,
      pagination.page,
      pagination.limit,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'ARZT')
  findById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.patientService.findById(user.practiceId!, id);
  }

  @Post()
  @Roles('ADMIN', 'ARZT')
  create(
    @Body() dto: CreatePatientDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.patientService.create(user.practiceId!, dto);
  }

  @Get('lookup/:hash')
  @Roles('ADMIN', 'ARZT')
  findByLookupHash(
    @Param('hash') hash: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.patientService.findByLookupHash(user.practiceId!, hash);
  }

  @Delete(':id')
  @Roles('ADMIN')
  delete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.patientService.delete(user.practiceId!, id);
  }
}
