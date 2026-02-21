import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TreatmentPlanService } from './treatment-plan.service';
import {
  CreateTreatmentPlanDto,
  UpdateTreatmentPlanDto,
  CreateTemplateDto,
  UpdateTemplateDto,
} from './treatment-plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SubscriptionGuard } from '../billing/subscription.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@Roles('ADMIN', 'ARZT')
export class TreatmentPlanController {
  constructor(private readonly service: TreatmentPlanService) {}

  // --- Treatment Plans ---

  @Post('treatment-plans')
  createPlan(
    @Body() dto: CreateTreatmentPlanDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.createPlan(user.practiceId!, user.userId, dto);
  }

  @Get('treatment-plans/patient/:patientId')
  findPlansByPatient(
    @Param('patientId') patientId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.service.findPlansByPatient(
      user.practiceId!,
      patientId,
      pagination.page,
      pagination.limit,
    );
  }

  @Get('treatment-plans/:id')
  findPlanById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.findPlanById(user.practiceId!, user.userId, id);
  }

  @Patch('treatment-plans/:id')
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateTreatmentPlanDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.updatePlan(user.practiceId!, user.userId, id, dto);
  }

  @Delete('treatment-plans/:id')
  deletePlan(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.deletePlan(user.practiceId!, id);
  }

  // --- Templates ---

  @Get('treatment-templates')
  findTemplates(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findTemplates(user.practiceId!);
  }

  @Post('treatment-templates')
  createTemplate(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.createTemplate(user.practiceId!, dto);
  }

  @Patch('treatment-templates/:id')
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.updateTemplate(user.practiceId!, id, dto);
  }

  @Delete('treatment-templates/:id')
  deleteTemplate(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.deleteTemplate(user.practiceId!, id);
  }
}
