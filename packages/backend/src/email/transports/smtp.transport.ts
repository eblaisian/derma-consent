import { createTransport } from 'nodemailer';
import type { IEmailTransport, SendEmailOptions } from './email-transport.interface';

type ConfigGetter = { get(key: string): Promise<string | undefined> };

export class SmtpTransport implements IEmailTransport {
  constructor(private readonly config: ConfigGetter) {}

  async send(options: SendEmailOptions): Promise<void> {
    const transporter = await this.buildTransporter();
    await transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
  }

  async test(): Promise<{ success: boolean; message: string }> {
    const smtpUser = await this.config.get('email.smtpUser');
    const smtpPass = await this.config.get('email.smtpPass');
    if (!smtpUser || !smtpPass) {
      return { success: false, message: 'SMTP credentials not configured' };
    }

    const host = (await this.config.get('email.smtpHost')) || 'smtp.gmail.com';
    const port = parseInt((await this.config.get('email.smtpPort')) || '465', 10);

    try {
      const transporter = await this.buildTransporter();
      await transporter.verify();
      return { success: true, message: `SMTP connection to ${host}:${port} successful` };
    } catch (error) {
      return { success: false, message: `SMTP connection failed: ${(error as Error).message}` };
    }
  }

  private async buildTransporter() {
    const host = (await this.config.get('email.smtpHost')) || 'smtp.gmail.com';
    const port = parseInt((await this.config.get('email.smtpPort')) || '465', 10);
    const user = await this.config.get('email.smtpUser');
    const pass = await this.config.get('email.smtpPass');

    return createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: user!, pass: pass! },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    });
  }
}
