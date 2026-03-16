import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';
import { IsIn, IsOptional, IsString } from 'class-validator';

class TestNotificationDto {
  @IsIn(['email', 'sms', 'whatsapp'])
  channel!: 'email' | 'sms' | 'whatsapp';

  @IsOptional()
  @IsString()
  recipient?: string;
}

@Controller('api/admin/notifications')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class NotificationLogController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly platformConfig: PlatformConfigService,
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
  async sendTestNotification(
    @Body() dto: TestNotificationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const recipient = dto.recipient || user.email;

    try {
      if (dto.channel === 'email') {
        await this.emailService.sendCustomMessage(
          recipient,
          'DermaConsent — Test Email',
          'This is a test email from DermaConsent.\n\nIf you are reading this, your email configuration is working correctly.\n\nNo action required.',
        );
        return { success: true, message: `Test email sent to ${recipient}` };
      }

      if (dto.channel === 'sms') {
        if (!this.smsService.isConfigured) {
          return { success: false, message: 'SMS is not configured. Configure the seven.io API key in Admin > Config > SMS.' };
        }
        await this.smsService.sendMessage(recipient, 'DermaConsent Test: Your SMS configuration is working correctly.');
        return { success: true, message: `Test SMS sent to ${recipient}` };
      }

      if (dto.channel === 'whatsapp') {
        const whatsappEnabled = await this.platformConfig.get('sms.whatsappEnabled');
        if (whatsappEnabled !== 'true') {
          return { success: false, message: 'WhatsApp is disabled. Enable it in Admin > Config > SMS > WhatsApp Enabled toggle.' };
        }
        if (!this.smsService.isConfigured) {
          return { success: false, message: 'WhatsApp is not configured. Configure the seven.io API key in Admin > Config > SMS.' };
        }
        await this.smsService.sendMessage(recipient, 'DermaConsent Test: Your WhatsApp configuration is working correctly.', 'whatsapp');
        return { success: true, message: `Test WhatsApp message sent to ${recipient}` };
      }

      return { success: false, message: `Unknown channel: ${dto.channel}` };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Failed to send test ${dto.channel}: ${errorMsg}` };
    }
  }
}
