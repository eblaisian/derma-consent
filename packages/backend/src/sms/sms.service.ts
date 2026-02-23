import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PlatformConfigService } from '../platform-config/platform-config.service';

@Injectable()
export class SmsService implements OnModuleInit {
  private readonly logger = new Logger(SmsService.name);
  private client: import('twilio').Twilio | null = null;
  private phoneNumber: string | undefined;

  constructor(private readonly platformConfig: PlatformConfigService) {}

  async onModuleInit() {
    const accountSid = await this.platformConfig.get('sms.twilioAccountSid');
    const authToken = await this.platformConfig.get('sms.twilioAuthToken');
    this.phoneNumber = await this.platformConfig.get('sms.twilioPhoneNumber');

    if (accountSid && authToken) {
      // Dynamic import to avoid errors when Twilio is not configured
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require('twilio') as (sid: string, token: string) => import('twilio').Twilio;
      this.client = twilio(accountSid, authToken);
      this.logger.log('Twilio client initialized');
    } else {
      this.logger.warn(
        'Twilio credentials not configured — SMS/WhatsApp delivery disabled',
      );
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async sendConsentLink(
    phone: string,
    channel: 'sms' | 'whatsapp',
    link: string,
    practiceName: string,
  ): Promise<void> {
    if (!this.client || !this.phoneNumber) {
      this.logger.warn('Twilio not configured, skipping SMS/WhatsApp delivery');
      return;
    }

    const body = `${practiceName}: Please complete your consent form: ${link}`;

    const to = channel === 'whatsapp' ? `whatsapp:${phone}` : phone;
    const from =
      channel === 'whatsapp'
        ? `whatsapp:${this.phoneNumber}`
        : this.phoneNumber;

    try {
      const message = await this.client.messages.create({ to, from, body });
      this.logger.log(
        `Consent link sent via ${channel} to ${phone} (SID: ${message.sid})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send consent link via ${channel} to ${phone}`,
        error,
      );
      throw error;
    }
  }
}
