import { Resend } from 'resend';
import type { IEmailTransport, SendEmailOptions } from './email-transport.interface';

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

  async test(): Promise<{ success: boolean; message: string }> {
    const apiKey = await this.config.get('email.resendApiKey');
    if (!apiKey) {
      return { success: false, message: 'Resend API key not configured' };
    }

    try {
      const client = new Resend(apiKey);
      const { error } = await client.domains.list();
      if (error) {
        return { success: false, message: `Resend connection failed: ${error.message}` };
      }
      return { success: true, message: 'Resend API connection successful' };
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
