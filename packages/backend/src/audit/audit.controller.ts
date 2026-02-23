import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { AuditAction } from '@prisma/client';
import { PaginationDto } from '../common/pagination.dto';

@Controller('api/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN')
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() pagination: PaginationDto,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.findByPractice(user.practiceId!, {
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: pagination.page,
      limit: pagination.limit,
    });
  }

  @Get('export')
  @Roles('ADMIN')
  async exportCsv(
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('locale') locale?: string,
  ) {
    const csv = await this.auditService.exportCsv(user.practiceId!, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      locale,
    });

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`,
    });
    res.send(csv);
  }

  @Post('vault-event')
  async vaultEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { action: 'VAULT_UNLOCKED' | 'VAULT_LOCKED' },
  ) {
    await this.auditService.log({
      practiceId: user.practiceId!,
      userId: user.userId,
      action: body.action as AuditAction,
    });
    return { success: true };
  }
}
