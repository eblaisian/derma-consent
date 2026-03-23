import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { SendAdminEmailDto, SendCampaignBatchDto } from './dto/admin.dto';

@Controller('api/admin/email')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminEmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  @Post('send')
  @SkipThrottle()
  async sendEmail(
    @Body() dto: SendAdminEmailDto,
    @CurrentUser() user: { id: string },
  ) {
    const result = await this.emailService.sendRawEmail(
      dto.to,
      dto.subject,
      dto.html,
      dto.fromAddress,
    );

    await this.auditService.log({
      action: 'ADMIN_EMAIL_SENT',
      userId: user.id,
      metadata: {
        subject: dto.subject,
        recipientCount: dto.to.length,
        sent: result.sent,
        failed: result.failed,
      },
    });

    return {
      success: true,
      sent: result.sent,
      failed: result.failed,
      recipientCount: dto.to.length,
    };
  }

  @Post('send-campaign-batch')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async sendCampaignBatch(
    @Body() dto: SendCampaignBatchDto,
    @CurrentUser() user: { id: string },
  ) {
    const { results } = await this.emailService.sendCampaignBatch(
      dto.emails.map((e) => ({ to: e.to, subject: e.subject, html: e.html })),
      dto.fromAddress,
    );

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    await this.auditService.log({
      action: 'ADMIN_EMAIL_SENT',
      userId: user.id,
      metadata: {
        subject: dto.emails[0]?.subject ?? 'Campaign Batch',
        recipientCount: dto.emails.length,
        sent,
        failed,
        type: 'campaign_batch',
      },
    });

    return { success: true, sent, failed, results };
  }
}
