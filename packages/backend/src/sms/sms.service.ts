import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PlatformConfigService } from '../platform-config/platform-config.service';

interface SevenSmsResponse {
  success: string;
  total_price: number;
  balance: number;
  messages: Array<{
    id: string;
    recipient: string;
    text: string;
    price: number;
    success: boolean;
  }>;
}

@Injectable()
export class SmsService implements OnModuleInit {
  private readonly logger = new Logger(SmsService.name);
  private apiKey: string | null = null;
  private sender: string | undefined;

  constructor(private readonly platformConfig: PlatformConfigService) {}

  async onModuleInit() {
    await this.reinitialize();
  }

  /**
   * Re-read seven.io credentials from PlatformConfig.
   * Called at startup and after admin config changes.
   */
  async reinitialize(): Promise<void> {
    this.platformConfig.invalidate('sms.sevenApiKey');
    this.platformConfig.invalidate('sms.senderName');

    this.apiKey = (await this.platformConfig.get('sms.sevenApiKey')) ?? null;
    this.sender = (await this.platformConfig.get('sms.senderName')) ?? 'DermaConsent';

    if (this.apiKey) {
      this.logger.log('seven.io SMS client initialized');
    } else {
      this.logger.warn('seven.io API key not configured — SMS delivery disabled');
    }
  }

  get isConfigured(): boolean {
    return this.apiKey !== null;
  }

  async sendConsentLink(
    phone: string,
    channel: 'sms' | 'whatsapp',
    link: string,
    practiceName: string,
  ): Promise<void> {
    const body = `${practiceName}: Please complete your consent form: ${link}`;
    await this.sendMessage(phone, body, channel);
  }

  async sendMessage(phone: string, body: string, channel: 'sms' | 'whatsapp' = 'sms'): Promise<void> {
    if (!this.apiKey) {
      this.logger.log(`[NO-OP] ${channel.toUpperCase()} to ${phone}: ${body.substring(0, 50)}...`);
      return;
    }

    // seven.io does not support WhatsApp yet — log and skip
    if (channel === 'whatsapp') {
      this.logger.warn(`WhatsApp not supported by seven.io — skipping message to ${phone}`);
      return;
    }

    try {
      const response = await fetch('https://gateway.seven.io/api/sms', {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          to: phone,
          text: body,
          from: this.sender || 'DermaConsent',
        }),
      });

      const data = (await response.json()) as SevenSmsResponse;

      if (data.success === '100') {
        const msgId = data.messages?.[0]?.id ?? 'unknown';
        this.logger.log(`SMS sent to ${phone} (ID: ${msgId}, cost: €${data.total_price})`);
      } else {
        const errorCode = data.success;
        throw new Error(`seven.io returned error code ${errorCode}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}`, error);
      throw error;
    }
  }
}
