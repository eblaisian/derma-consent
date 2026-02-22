import { Controller, Post, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { CreatePracticeDto } from './practice.dto';
import { UpdatePracticeDto } from './update-practice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('api/practice')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post()
  create(@Body() dto: CreatePracticeDto, @CurrentUser() user: CurrentUserPayload) {
    return this.practiceService.create(dto, user.userId);
  }

  @Get()
  findById(@CurrentUser() user: CurrentUserPayload) {
    return this.practiceService.findById(user.practiceId!);
  }

  @Patch()
  @Roles('ADMIN')
  update(@Body() dto: UpdatePracticeDto, @CurrentUser() user: CurrentUserPayload) {
    return this.practiceService.update(user.practiceId!, dto);
  }
}
