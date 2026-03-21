import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { SendAdminEmailDto } from './dto/admin.dto';

@Controller('api/admin/email')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@SkipThrottle()
export class AdminEmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  @Post('send')
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
}
