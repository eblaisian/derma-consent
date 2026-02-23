import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { Resend } from 'resend';
import { consentLinkTemplate, getConsentLinkSubject } from './templates/consent-link.template';
import { inviteTemplate, getInviteSubject } from './templates/invite.template';
import { welcomeTemplate, getWelcomeSubject } from './templates/welcome.template';
import { subscriptionTemplate, getSubscriptionSubject } from './templates/subscription.template';
import { passwordResetTemplate, getPasswordResetSubject } from './templates/password-reset.template';
import { emailVerificationTemplate, getEmailVerificationSubject } from './templates/email-verification.template';

type Locale = 'de' | 'en' | 'es' | 'fr';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private fromEmail: string = 'noreply@dermaconsent.de';

  constructor(private readonly platformConfig: PlatformConfigService) {}

  async onModuleInit() {
    const apiKey = await this.platformConfig.get('email.resendApiKey');
    this.fromEmail = (await this.platformConfig.get('email.fromAddress')) || 'noreply@dermaconsent.de';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('Resend API key not set — emails will be no-oped');
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.resend) {
      this.logger.log(`[NO-OP] Email to ${to}: ${subject}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error}`);
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
}
