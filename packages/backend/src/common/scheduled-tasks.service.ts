import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConsentStatus } from '@prisma/client';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Mark expired PENDING consents as EXPIRED.
   * Runs every hour.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expireConsents() {
    const now = new Date();

    const result = await this.prisma.consentForm.updateMany({
      where: {
        status: ConsentStatus.PENDING,
        expiresAt: { lt: now },
      },
      data: {
        status: ConsentStatus.EXPIRED,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} pending consent form(s)`);
    }
  }

  /**
   * Send trial expiry notifications at 3 days and 1 day before trial ends.
   * Uses day boundaries to avoid duplicate emails.
   * Runs daily at 9:00 AM.
   */
  @Cron('0 9 * * *')
  async sendTrialExpiryNotifications() {
    const now = new Date();
    // Notify on exact day boundaries: 3 days out and 1 day out
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
      where: {
        status: 'TRIALING',
        OR: conditions,
      },
      include: {
        practice: {
          include: {
            users: {
              where: { role: 'ADMIN' },
              select: { email: true },
            },
          },
        },
      },
    });

    for (const sub of expiringSubscriptions) {
      for (const admin of sub.practice.users) {
        try {
          await this.emailService.sendSubscriptionNotice(
            admin.email,
            'trial_expiring',
            sub.practice.name,
          );
        } catch (err) {
          this.logger.error(
            `Failed to send trial expiry notification to ${admin.email}: ${err}`,
          );
        }
      }
    }

    if (expiringSubscriptions.length > 0) {
      this.logger.log(
        `Sent trial expiry notifications for ${expiringSubscriptions.length} practice(s)`,
      );
    }
  }

  /**
   * Send consent reminder notifications for PENDING consents expiring within 3 days.
   * Notifies practice admins so they can re-send or follow up with patients.
   * Runs daily at 10:00 AM (after trial notifications).
   */
  @Cron('0 10 * * *')
  async sendConsentReminders() {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Find PENDING consents expiring in 2-3 days (single-day window to avoid duplicates)
    const pendingConsents = await this.prisma.consentForm.findMany({
      where: {
        status: ConsentStatus.PENDING,
        expiresAt: {
          gt: twoDaysFromNow,
          lte: threeDaysFromNow,
        },
      },
      include: {
        practice: {
          include: {
            users: {
              where: { role: 'ADMIN' },
              select: { email: true },
            },
          },
        },
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    for (const consent of pendingConsents) {
      const consentLink = `${frontendUrl}/consent/${consent.token}`;
      for (const admin of consent.practice.users) {
        try {
          await this.emailService.sendConsentReminder(
            admin.email,
            consent.practice.name,
            consentLink,
          );
        } catch (err) {
          this.logger.error(
            `Failed to send consent reminder to ${admin.email}: ${err}`,
          );
        }
      }
    }

    if (pendingConsents.length > 0) {
      this.logger.log(
        `Sent consent reminders for ${pendingConsents.length} pending consent(s)`,
      );
    }
  }
}
