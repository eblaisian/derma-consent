import { Controller, Get, Post, Query, UseGuards, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';

@Controller('api/admin/notifications')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class NotificationLogController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Get()
  async getLogs(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('templateKey') templateKey?: string,
    @Query('practiceId') practiceId?: string,
  ) {
    const skip = ((pagination.page || 1) - 1) * (pagination.limit || 50);

    const where = {
      ...(status && { status: status as 'PENDING' | 'SENT' | 'FAILED' }),
      ...(channel && { channel }),
      ...(templateKey && { templateKey }),
      ...(practiceId && { practiceId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.limit || 50,
        select: {
          id: true,
          practiceId: true,
          recipientType: true,
          channel: true,
          templateKey: true,
          locale: true,
          status: true,
          providerRef: true,
          errorMessage: true,
          metadata: true,
          sentAt: true,
          createdAt: true,
          practice: { select: { name: true } },
        },
      }),
      this.prisma.notificationLog.count({ where }),
    ]);

    return {
      items,
      total,
      page: pagination.page || 1,
      limit: pagination.limit || 50,
      totalPages: Math.ceil(total / (pagination.limit || 50)),
    };
  }

  @Get('stats')
  async getStats() {
    const [total, sent, failed, pending] = await Promise.all([
      this.prisma.notificationLog.count(),
      this.prisma.notificationLog.count({ where: { status: 'SENT' } }),
      this.prisma.notificationLog.count({ where: { status: 'FAILED' } }),
      this.prisma.notificationLog.count({ where: { status: 'PENDING' } }),
    ]);

    return { total, sent, failed, pending };
  }

  @Post('test')
  async sendTestEmail(@CurrentUser() user: CurrentUserPayload) {
    await this.emailService.sendCustomMessage(
      user.email,
      'DermaConsent — Test Email',
      'This is a test email from DermaConsent. If you are reading this, your email configuration is working correctly.',
    );
    return { success: true, message: `Test email sent to ${user.email}` };
  }
}
