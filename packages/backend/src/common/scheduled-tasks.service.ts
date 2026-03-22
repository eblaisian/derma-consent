import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { UsageAlertService } from '../usage/usage-alert.service';
import { ConsentStatus } from '@prisma/client';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly usageAlertService: UsageAlertService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireConsents() {
    const now = new Date();
    const result = await this.prisma.consentForm.updateMany({
      where: {
        status: ConsentStatus.PENDING,
        expiresAt: { lt: now },
      },
      data: { status: ConsentStatus.EXPIRED },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} pending consent form(s)`);
    }
  }

  @Cron('0 9 * * *')
  async sendTrialExpiryNotifications() {
    const now = new Date();
    const windows = [
      { start: 2 * 24 * 60 * 60 * 1000, end: 3 * 24 * 60 * 60 * 1000 },
      { start: 0, end: 1 * 24 * 60 * 60 * 1000 },
    ];

    const conditions = windows.map((w) => ({
      trialEndsAt: {
        gt: new Date(now.getTime() + w.start),
        lte: new Date(now.getTime() + w.end),
      },
    }));

    const expiringSubscriptions = await this.prisma.subscription.findMany({
      where: { status: 'TRIALING', OR: conditions },
      include: {
        practice: {
          include: {
            users: {
              where: { role: 'ADMIN' },
              select: { id: true, email: true, locale: true },
            },
          },
        },
      },
    });

    for (const sub of expiringSubscriptions) {
      const daysLeft = sub.trialEndsAt
        ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86400000))
        : 3;

      for (const admin of sub.practice.users) {
        await this.notificationService.sendSubscriptionNotice({
          practiceId: sub.practiceId,
          recipientEmail: admin.email,
          type: 'trial_expiring',
          practiceName: sub.practice.name,
          userId: admin.id,
          locale: admin.locale,
          daysLeft,
        });
      }
    }

    if (expiringSubscriptions.length > 0) {
      this.logger.log(`Sent trial expiry notifications for ${expiringSubscriptions.length} practice(s)`);
    }
  }

  @Cron('0 10 * * *')
  async sendConsentReminders() {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const pendingConsents = await this.prisma.consentForm.findMany({
      where: {
        status: ConsentStatus.PENDING,
        expiresAt: { gt: twoDaysFromNow, lte: threeDaysFromNow },
      },
      include: {
        practice: {
          include: {
            users: {
              where: { role: 'ADMIN' },
              select: { email: true, locale: true },
            },
          },
        },
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    for (const consent of pendingConsents) {
      const consentLink = `${frontendUrl}/consent/${consent.token}`;
      for (const admin of consent.practice.users) {
        await this.notificationService.sendConsentReminder({
          practiceId: consent.practiceId,
          recipientEmail: admin.email,
          practiceName: consent.practice.name,
          consentLink,
          locale: admin.locale,
        });
      }
    }

    if (pendingConsents.length > 0) {
      this.logger.log(`Sent consent reminders for ${pendingConsents.length} pending consent(s)`);
    }
  }

  /** Clean up notification logs older than 90 days (GDPR data minimization) */
  @Cron('0 3 * * *')
  async cleanupNotificationLogs() {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.notificationLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} notification log(s) older than 90 days`);
    }
  }

  /** Check usage quotas for all active practices and send alert emails at 80% */
  @Cron('0 8 * * *')
  async checkUsageAlerts() {
    const practices = await this.prisma.practice.findMany({
      where: {
        isSuspended: false,
        subscription: {
          status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
        },
      },
      select: { id: true },
    });

    let alertsSent = 0;
    for (const practice of practices) {
      try {
        await this.usageAlertService.checkAndSendAlerts(practice.id);
        alertsSent++;
      } catch (err) {
        this.logger.error(`Failed to check usage alerts for practice ${practice.id}: ${err}`);
      }
    }

    if (practices.length > 0) {
      this.logger.log(`Checked usage alerts for ${practices.length} practice(s)`);
    }
  }
}
