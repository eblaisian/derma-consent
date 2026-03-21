import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import type { SendNotificationOptions, NotificationLocale } from './notification.types';
import type { EmailLocale } from '../email/templates/types';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  /**
   * Resolve locale: explicit > user preference > default 'de'
   */
  async resolveLocale(explicitLocale?: string, userId?: string): Promise<NotificationLocale> {
    if (explicitLocale) return explicitLocale as NotificationLocale;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { locale: true },
      });
      if (user?.locale) return user.locale as NotificationLocale;
    }

    return 'de';
  }

  /**
   * Check if a notification type is enabled via PlatformConfig.
   */
  async isEnabled(templateKey: string): Promise<boolean> {
    const configKey = `notifications.${templateKey}Enabled`;
    const value = await this.platformConfig.get(configKey);
    // Default to enabled if not explicitly disabled
    return value !== 'false';
  }

  /**
   * Log a notification attempt and return the log ID.
   */
  async logSend(opts: SendNotificationOptions & { locale: string }): Promise<string> {
    const log = await this.prisma.notificationLog.create({
      data: {
        practiceId: opts.practiceId || null,
        recipientType: opts.recipientType,
        channel: opts.channel,
        templateKey: opts.templateKey,
        locale: opts.locale,
        status: 'PENDING',
        metadata: opts.metadata ? (opts.metadata as object) : undefined,
      },
    });
    return log.id;
  }

  /**
   * Mark a notification as sent.
   */
  async markSent(logId: string, providerRef?: string): Promise<void> {
    await this.prisma.notificationLog.update({
      where: { id: logId },
      data: { status: 'SENT', sentAt: new Date(), providerRef },
    });
  }

  /**
   * Mark a notification as failed.
   */
  async markFailed(logId: string, errorMessage: string): Promise<void> {
    await this.prisma.notificationLog.update({
      where: { id: logId },
      data: { status: 'FAILED', errorMessage: errorMessage.substring(0, 500) },
    });
  }

  // ── High-level send methods (replace direct EmailService/SmsService calls) ──

  async sendConsentLink(opts: {
    practiceId: string;
    recipientEmail: string;
    practiceName: string;
    consentLink: string;
    expiryDays: number;
    locale?: string;
    userId?: string;
    brandColor?: string;
  }): Promise<void> {
    if (!(await this.isEnabled('consentLink'))) return;

    const locale = await this.resolveLocale(opts.locale, opts.userId);
    const logId = await this.logSend({
      practiceId: opts.practiceId,
      recipientType: 'patient',
      channel: 'email',
      templateKey: 'consent_link',
      locale,
    });

    try {
      let brandColor = opts.brandColor;
      if (!brandColor && opts.practiceId) {
        const settings = await this.prisma.practiceSettings.findUnique({
          where: { practiceId: opts.practiceId },
          select: { brandColor: true },
        });
        brandColor = settings?.brandColor ?? undefined;
      }

      await this.emailService.sendConsentLink(
        opts.recipientEmail,
        opts.practiceName,
        opts.consentLink,
        opts.expiryDays,
        locale as EmailLocale,
        brandColor,
      );
      await this.markSent(logId);
    } catch (err) {
      await this.markFailed(logId, String(err));
      this.logger.error(`Failed to send consent link: ${err}`);
    }
  }

  async sendConsentLinkViaSms(opts: {
    practiceId: string;
    phone: string;
    channel: 'sms' | 'whatsapp';
    link: string;
    practiceName: string;
  }): Promise<void> {
    if (!(await this.isEnabled('consentLink'))) return;

    // Block WhatsApp sends when feature is disabled
    if (opts.channel === 'whatsapp') {
      const whatsappEnabled = await this.platformConfig.get('sms.whatsappEnabled');
      if (whatsappEnabled !== 'true') {
        this.logger.warn('WhatsApp delivery requested but feature is disabled — skipping');
        return;
      }
    }

    const logId = await this.logSend({
      practiceId: opts.practiceId,
      recipientType: 'patient',
      channel: opts.channel,
      templateKey: 'consent_link',
      locale: 'de',
    });

    try {
      await this.smsService.sendConsentLink(opts.phone, opts.channel, opts.link, opts.practiceName);
      await this.markSent(logId);
    } catch (err) {
      await this.markFailed(logId, String(err));
      this.logger.error(`Failed to send consent link via ${opts.channel}: ${err}`);
    }
  }

  async sendTeamInvite(opts: {
    practiceId: string;
    recipientEmail: string;
    practiceName: string;
    role: string;
    inviteLink: string;
    locale?: string;
    userId?: string;
  }): Promise<void> {
    if (!(await this.isEnabled('invite'))) return;

    const locale = await this.resolveLocale(opts.locale, opts.userId);
    const logId = await this.logSend({
      practiceId: opts.practiceId,
      recipientType: 'external',
      channel: 'email',
      templateKey: 'invite',
      locale,
      metadata: { role: opts.role },
    });

    try {
      await this.emailService.sendInvite(
        opts.recipientEmail,
        opts.practiceName,
        opts.role,
        opts.inviteLink,
        locale as EmailLocale,
      );
      await this.markSent(logId);
    } catch (err) {
      await this.markFailed(logId, String(err));
      this.logger.error(`Failed to send team invite: ${err}`);
    }
  }

  async sendWelcome(opts: {
    recipientEmail: string;
    userName: string;
    userId?: string;
    locale?: string;
  }): Promise<void> {
    if (!(await this.isEnabled('welcome'))) return;

    const locale = await this.resolveLocale(opts.locale, opts.userId);
    const logId = await this.logSend({
      recipientType: 'user',
      channel: 'email',
      templateKey: 'welcome',
      locale,
    });

    try {
      await this.emailService.sendWelcome(
        opts.recipientEmail,
        opts.userName,
        locale as EmailLocale,
      );
      await this.markSent(logId);
    } catch (err) {
      await this.markFailed(logId, String(err));
      this.logger.error(`Failed to send welcome email: ${err}`);
    }
  }

  async sendEmailVerification(opts: {
    recipientEmail: string;
    verifyLink: string;
    userId?: string;
    locale?: string;
  }): Promise<void> {
    const locale = await this.resolveLocale(opts.locale, opts.userId);
    const logId = await this.logSend({
      recipientType: 'user',
      channel: 'email',
      templateKey: 'email_verification',
      locale,
    });

    try {
      await this.emailService.sendEmailVerification(
        opts.recipientEmail,
        opts.verifyLink,
        locale as EmailLocale,
      );
      await this.markSent(logId);
    } catch (err) {
      await this.markFailed(logId, String(err));
      this.logger.error(`Failed to send verification email: ${err}`);
    }
  }

  async sendPasswordReset(opts: {
    recipientEmail: string;
    resetLink: string;
    userId?: string;
    locale?: string;
  }): Promise<void> {
    const locale = await this.resolveLocale(opts.locale, opts.userId);
    const logId = await this.logSend({
      recipientType: 'user',
      channel: 'email',
      templateKey: 'password_reset',
      locale,
    });

    try {
      await this.emailService.sendPasswordReset(
        opts.recipientEmail,
        opts.resetLink,
        locale as EmailLocale,
      );
      await this.markSent(logId);
    } catch (err) {
      await this.markFailed(logId, String(err));
      this.logger.error(`Failed to send password reset: ${err}`);
    }
  }

  async sendSubscriptionNotice(opts: {
    practiceId: string;
    recipientEmail: string;
    type: 'trial_expiring' | 'payment_failed';
    practiceName: string;
    userId?: string;
    locale?: string;
    daysLeft?: number;
  }): Promise<void> {
    if (!(await this.isEnabled('subscriptionAlerts'))) return;

    const locale = await this.resolveLocale(opts.locale, opts.userId);
    const logId = await this.logSend({
      practiceId: opts.practiceId,
      recipientType: 'user',
      channel: 'email',
      templateKey: 'subscription_notice',
      locale,
      metadata: { type: opts.type },
    });

    try {
      await this.emailService.sendSubscriptionNotice(
        opts.recipientEmail,
        opts.type,
        opts.practiceName,
        locale as EmailLocale,
        opts.daysLeft,
      );
      await this.markSent(logId);
    } catch (err) {
      await this.markFailed(logId, String(err));
      this.logger.error(`Failed to send subscription notice: ${err}`);
    }
  }

  async sendConsentReminder(opts: {
    practiceId: string;
    recipientEmail: string;
    practiceName: string;
    consentLink: string;
    locale?: string;
    userId?: string;
    brandColor?: string;
  }): Promise<void> {
    if (!(await this.isEnabled('consentReminder'))) return;

    const locale = await this.resolveLocale(opts.locale, opts.userId);
    const logId = await this.logSend({
      practiceId: opts.practiceId,
      recipientType: 'user',
      channel: 'email',
      templateKey: 'consent_reminder',
      locale,
    });

    try {
      let brandColor = opts.brandColor;
      if (!brandColor && opts.practiceId) {
        const settings = await this.prisma.practiceSettings.findUnique({
          where: { practiceId: opts.practiceId },
          select: { brandColor: true },
        });
        brandColor = settings?.brandColor ?? undefined;
      }

      await this.emailService.sendConsentReminder(
        opts.recipientEmail,
        opts.practiceName,
        opts.consentLink,
        locale as EmailLocale,
        brandColor,
      );
      await this.markSent(logId);
    } catch (err) {
      await this.markFailed(logId, String(err));
      this.logger.error(`Failed to send consent reminder: ${err}`);
    }
  }

  async sendCustomMessage(opts: {
    practiceId: string;
    recipientEmail?: string;
    recipientPhone?: string;
    channel: 'email' | 'sms' | 'whatsapp';
    message: string;
    subject?: string;
    isHtml?: boolean;
    locale?: string;
    userId?: string;
    practiceName?: string;
    brandColor?: string;
  }): Promise<void> {
    // Block WhatsApp sends when feature is disabled
    if (opts.channel === 'whatsapp') {
      const whatsappEnabled = await this.platformConfig.get('sms.whatsappEnabled');
      if (whatsappEnabled !== 'true') {
        this.logger.warn('WhatsApp message requested but feature is disabled — skipping');
        return;
      }
    }

    const locale = await this.resolveLocale(opts.locale, opts.userId);

    const logId = await this.logSend({
      practiceId: opts.practiceId,
      recipientType: 'patient',
      channel: opts.channel,
      templateKey: 'custom_message',
      locale,
    });

    try {
      if (opts.channel === 'email' && opts.recipientEmail) {
        await this.emailService.sendCustomMessage(
          opts.recipientEmail,
          opts.subject || 'Nachricht von Ihrer Praxis',
          opts.message,
          {
            isHtml: opts.isHtml,
            locale: locale as EmailLocale,
            practiceName: opts.practiceName,
            brandColor: opts.brandColor,
          },
        );
      } else if (opts.channel === 'sms' && opts.recipientPhone) {
        await this.smsService.sendMessage(opts.recipientPhone, opts.message);
      } else if (opts.channel === 'whatsapp' && opts.recipientPhone) {
        await this.smsService.sendMessage(opts.recipientPhone, opts.message, 'whatsapp');
      }
      await this.markSent(logId);
    } catch (err) {
      await this.markFailed(logId, String(err));
      this.logger.error(`Failed to send custom message: ${err}`);
    }
  }
}
