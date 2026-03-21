import { Injectable, Logger } from '@nestjs/common';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { consentLinkTemplate, getConsentLinkSubject } from './templates/consent-link.template';
import { inviteTemplate, getInviteSubject } from './templates/invite.template';
import { welcomeTemplate, getWelcomeSubject } from './templates/welcome.template';
import { subscriptionTemplate, getSubscriptionSubject } from './templates/subscription.template';
import { passwordResetTemplate, getPasswordResetSubject } from './templates/password-reset.template';
import { emailVerificationTemplate, getEmailVerificationSubject } from './templates/email-verification.template';
import { consentReminderTemplate, getConsentReminderSubject } from './templates/consent-reminder.template';
import { baseLayout, stripHtmlToText } from './templates/base-layout';
import type { EmailLocale } from './templates/types';
import type { IEmailTransport } from './transports';
import { ResendTransport } from './transports';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly platformConfig: PlatformConfigService) {}

  private async getTransport(): Promise<IEmailTransport | null> {
    const apiKey = await this.platformConfig.get('email.resendApiKey');
    if (!apiKey) return null;
    return new ResendTransport(this.platformConfig);
  }

  private async send(opts: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    fromNameOverride?: string;
    replyTo?: string;
  }) {
    const transport = await this.getTransport();

    if (!transport) {
      this.logger.log(`[NO-OP] Email to ${opts.to}: ${opts.subject}`);
      return;
    }

    try {
      const fromName = opts.fromNameOverride
        || (await this.platformConfig.get('email.fromName'))
        || 'DermaConsent';
      const fromAddress = (await this.platformConfig.get('email.fromAddress')) || 'noreply@derma-consent.de';
      const text = opts.text || stripHtmlToText(opts.html);

      await transport.send({
        from: `${fromName} <${fromAddress}>`,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text,
        replyTo: opts.replyTo,
      });
      this.logger.log(`Email sent to ${opts.to}: ${opts.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${opts.to}: ${error}`);
      throw error;
    }
  }

  async sendConsentLink(
    to: string,
    practiceName: string,
    consentLink: string,
    expiryDays: number,
    locale: EmailLocale = 'de',
    brandColor?: string,
  ) {
    await this.send({
      to,
      subject: getConsentLinkSubject(practiceName, locale),
      html: consentLinkTemplate(practiceName, consentLink, expiryDays, locale, brandColor),
      fromNameOverride: `${practiceName} via DermaConsent`,
    });
  }

  async sendInvite(to: string, practiceName: string, role: string, inviteLink: string, locale: EmailLocale = 'de') {
    await this.send({
      to,
      subject: getInviteSubject(practiceName, locale),
      html: inviteTemplate(practiceName, role, inviteLink, locale),
    });
  }

  async sendWelcome(to: string, userName: string, locale: EmailLocale = 'de') {
    await this.send({
      to,
      subject: getWelcomeSubject(locale),
      html: welcomeTemplate(userName, locale),
    });
  }

  async sendSubscriptionNotice(
    to: string,
    type: 'trial_expiring' | 'payment_failed',
    practiceName: string,
    locale: EmailLocale = 'de',
    daysLeft: number = 3,
  ) {
    await this.send({
      to,
      subject: getSubscriptionSubject(type, practiceName, locale),
      html: subscriptionTemplate(type, practiceName, locale, daysLeft),
    });
  }

  async sendPasswordReset(to: string, resetLink: string, locale: EmailLocale = 'de') {
    await this.send({
      to,
      subject: getPasswordResetSubject(locale),
      html: passwordResetTemplate(resetLink, locale),
    });
  }

  async sendEmailVerification(to: string, verifyLink: string, locale: EmailLocale = 'de') {
    await this.send({
      to,
      subject: getEmailVerificationSubject(locale),
      html: emailVerificationTemplate(verifyLink, locale),
    });
  }

  async sendConsentReminder(
    to: string,
    practiceName: string,
    consentLink: string,
    locale: EmailLocale = 'de',
    brandColor?: string,
  ) {
    await this.send({
      to,
      subject: getConsentReminderSubject(practiceName, locale),
      html: consentReminderTemplate(practiceName, consentLink, locale, brandColor),
      fromNameOverride: `${practiceName} via DermaConsent`,
    });
  }

  async sendCustomMessage(to: string, subject: string, body: string, opts?: {
    isHtml?: boolean;
    locale?: EmailLocale;
    practiceName?: string;
    brandColor?: string;
  }) {
    const locale = opts?.locale || 'de';
    const practiceName = opts?.practiceName;

    let innerContent: string;
    if (opts?.isHtml) {
      innerContent = body;
    } else {
      const escaped = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      innerContent = `<div style="white-space: pre-wrap; line-height: 1.6;">${escaped.replace(/\n/g, '<br>')}</div>`;
    }

    const html = baseLayout(innerContent, {
      locale,
      practiceName,
      brandColor: opts?.brandColor,
    });

    await this.send({
      to,
      subject,
      html,
      fromNameOverride: practiceName ? `${practiceName} via DermaConsent` : undefined,
    });
  }
}
