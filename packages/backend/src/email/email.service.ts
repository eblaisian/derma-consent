import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { consentLinkTemplate } from './templates/consent-link.template';
import { inviteTemplate } from './templates/invite.template';
import { welcomeTemplate } from './templates/welcome.template';
import { subscriptionTemplate } from './templates/subscription.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'noreply@dermaconsent.de';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.resend = null;
      this.logger.warn('RESEND_API_KEY not set — emails will be no-oped');
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

  async sendConsentLink(to: string, practiceName: string, consentLink: string, expiryDays: number) {
    await this.send(
      to,
      `Einwilligungsformular von ${practiceName}`,
      consentLinkTemplate(practiceName, consentLink, expiryDays),
    );
  }

  async sendInvite(to: string, practiceName: string, role: string, inviteLink: string) {
    await this.send(
      to,
      `Einladung zu ${practiceName} — DermaConsent`,
      inviteTemplate(practiceName, role, inviteLink),
    );
  }

  async sendWelcome(to: string, userName: string) {
    await this.send(
      to,
      'Willkommen bei DermaConsent',
      welcomeTemplate(userName),
    );
  }

  async sendSubscriptionNotice(to: string, type: 'trial_expiring' | 'payment_failed', practiceName: string) {
    const subject = type === 'trial_expiring'
      ? `Testphase laeuft bald ab — ${practiceName}`
      : `Zahlungsproblem — ${practiceName}`;

    await this.send(to, subject, subscriptionTemplate(type, practiceName));
  }
}
