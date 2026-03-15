import { Injectable, Logger } from '@nestjs/common';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { consentLinkTemplate, getConsentLinkSubject } from './templates/consent-link.template';
import { inviteTemplate, getInviteSubject } from './templates/invite.template';
import { welcomeTemplate, getWelcomeSubject } from './templates/welcome.template';
import { subscriptionTemplate, getSubscriptionSubject } from './templates/subscription.template';
import { passwordResetTemplate, getPasswordResetSubject } from './templates/password-reset.template';
import { emailVerificationTemplate, getEmailVerificationSubject } from './templates/email-verification.template';
import { consentReminderTemplate, getConsentReminderSubject } from './templates/consent-reminder.template';
import type { IEmailTransport } from './transports';
import { SmtpTransport, ResendTransport, resolveEmailProvider } from './transports';

type Locale = 'de' | 'en' | 'es' | 'fr';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly platformConfig: PlatformConfigService) {}

  private async getTransport(): Promise<IEmailTransport | null> {
    const provider = await resolveEmailProvider((key) => this.platformConfig.get(key));
    if (!provider) return null;

    switch (provider) {
      case 'resend':
        return new ResendTransport(this.platformConfig);
      case 'smtp':
        return new SmtpTransport(this.platformConfig);
    }
  }

  private async send(to: string, subject: string, html: string) {
    const transport = await this.getTransport();

    if (!transport) {
      this.logger.log(`[NO-OP] Email to ${to}: ${subject}`);
      return;
    }

    try {
      const fromName = (await this.platformConfig.get('email.fromName')) || 'DermaConsent';
      const fromAddress = (await this.platformConfig.get('email.fromAddress')) || 'noreply@eblaisian.com';
      await transport.send({
        from: `${fromName} <${fromAddress}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error}`);
      throw error;
    }
  }

  async sendConsentLink(to: string, practiceName: string, consentLink: string, expiryDays: number, locale: Locale = 'de') {
    await this.send(
      to,
      getConsentLinkSubject(practiceName, locale),
      consentLinkTemplate(practiceName, consentLink, expiryDays, locale),
    );
  }

  async sendInvite(to: string, practiceName: string, role: string, inviteLink: string, locale: Locale = 'de') {
    await this.send(
      to,
      getInviteSubject(practiceName, locale),
      inviteTemplate(practiceName, role, inviteLink, locale),
    );
  }

  async sendWelcome(to: string, userName: string, locale: Locale = 'de') {
    await this.send(
      to,
      getWelcomeSubject(locale),
      welcomeTemplate(userName, locale),
    );
  }

  async sendSubscriptionNotice(to: string, type: 'trial_expiring' | 'payment_failed', practiceName: string, locale: Locale = 'de') {
    await this.send(
      to,
      getSubscriptionSubject(type, practiceName, locale),
      subscriptionTemplate(type, practiceName, locale),
    );
  }

  async sendPasswordReset(to: string, resetLink: string, locale: Locale = 'de') {
    await this.send(
      to,
      getPasswordResetSubject(locale),
      passwordResetTemplate(resetLink, locale),
    );
  }

  async sendEmailVerification(to: string, verifyLink: string, locale: Locale = 'de') {
    await this.send(
      to,
      getEmailVerificationSubject(locale),
      emailVerificationTemplate(verifyLink, locale),
    );
  }

  async sendConsentReminder(to: string, practiceName: string, consentLink: string, locale: Locale = 'de') {
    await this.send(
      to,
      getConsentReminderSubject(practiceName, locale),
      consentReminderTemplate(practiceName, consentLink, locale),
    );
  }

  async sendCustomMessage(to: string, subject: string, body: string) {
    const html = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="white-space: pre-wrap; line-height: 1.6;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">Gesendet über DermaConsent</p>
</body>
</html>`;
    await this.send(to, subject, html);
  }
}
