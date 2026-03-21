export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface IEmailTransport {
  send(options: SendEmailOptions): Promise<void>;
  test(): Promise<{ success: boolean; message: string }>;
}
