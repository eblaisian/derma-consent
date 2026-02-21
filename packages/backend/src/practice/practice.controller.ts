import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { CreatePracticeDto } from './practice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('api/practice')
@UseGuards(JwtAuthGuard)
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
}
