import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EmailService } from '../email/email.service';
import { ContactFormDto } from './contact.dto';

@Controller('api/contact')
export class ContactController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async submit(@Body() dto: ContactFormDto) {
    const practiceInfo = dto.practice ? `\nPraxis: ${dto.practice}` : '';

    await this.emailService.sendRawEmail(
      ['info@derma-consent.de'],
      `Kontaktanfrage: ${dto.name}`,
      `<div style="font-family: sans-serif; line-height: 1.6; max-width: 600px;">
        <h2 style="margin: 0 0 16px;">Neue Kontaktanfrage</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px 12px; font-weight: 600; color: #555; width: 100px;">Name</td><td style="padding: 8px 12px;">${dto.name}</td></tr>
          <tr><td style="padding: 8px 12px; font-weight: 600; color: #555;">E-Mail</td><td style="padding: 8px 12px;"><a href="mailto:${dto.email}">${dto.email}</a></td></tr>
          ${dto.practice ? `<tr><td style="padding: 8px 12px; font-weight: 600; color: #555;">Praxis</td><td style="padding: 8px 12px;">${dto.practice}</td></tr>` : ''}
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #f4f4f5; border-radius: 8px; white-space: pre-wrap;">${dto.message}</div>
      </div>`,
    );

    return { success: true };
  }
}
