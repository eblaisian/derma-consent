import { Resend } from 'resend';
import type { IEmailTransport, SendEmailOptions, BatchEmailItem, BatchSendResult } from './email-transport.interface';

type ConfigGetter = { get(key: string): Promise<string | undefined> };

export class ResendTransport implements IEmailTransport {
  constructor(private readonly config: ConfigGetter) {}

  async send(options: SendEmailOptions): Promise<void> {
    const client = await this.getClient();
    const { error } = await client.emails.send({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.isBuffer(a.content)
          ? a.content
          : Buffer.from(a.content),
        content_type: a.contentType,
      })),
    });
    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
  }

  async sendBatch(items: BatchEmailItem[]): Promise<BatchSendResult> {
    const client = await this.getClient();
    const { data, error } = await client.batch.send(
      items.map((item) => ({
        from: item.from,
        to: item.to,
        subject: item.subject,
        html: item.html,
        text: item.text,
        replyTo: item.replyTo,
      })),
    );

    if (error) {
      return {
        results: items.map((item) => ({
          email: item.to,
          success: false,
          error: error.message,
        })),
      };
    }

    return {
      results: items.map((item, i) => ({
        email: item.to,
        success: !!(data?.data?.[i]?.id),
        error: undefined,
      })),
    };
  }

  async test(): Promise<{ success: boolean; message: string }> {
    const apiKey = await this.config.get('email.resendApiKey');
    if (!apiKey) {
      return { success: false, message: 'Resend API key not configured' };
    }

    try {
      const client = new Resend(apiKey);
      const fromAddress = (await this.config.get('email.fromAddress')) || 'noreply@derma-consent.de';
      const fromName = (await this.config.get('email.fromName')) || 'DermaConsent';
      const { error } = await client.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to: 'delivered@resend.dev',
        subject: 'DermaConsent Connection Test',
        html: '<p>This is a test email from DermaConsent platform health check.</p>',
      });
      if (error) {
        return { success: false, message: `Resend test failed: ${error.message}` };
      }
      return { success: true, message: 'Test email sent successfully to delivered@resend.dev' };
    } catch (error) {
      return { success: false, message: `Resend connection failed: ${(error as Error).message}` };
    }
  }

  private async getClient(): Promise<Resend> {
    const apiKey = await this.config.get('email.resendApiKey');
    if (!apiKey) throw new Error('Resend API key not configured');
    return new Resend(apiKey);
  }
}
