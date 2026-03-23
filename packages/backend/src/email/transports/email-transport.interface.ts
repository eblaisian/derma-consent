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

/** A single email in a batch send request. */
export interface BatchEmailItem {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/** Per-recipient result from a batch send. */
export interface BatchRecipientResult {
  email: string;
  success: boolean;
  error?: string;
}

export interface BatchSendResult {
  results: BatchRecipientResult[];
}

export interface IEmailTransport {
  /** Send a single email. */
  send(options: SendEmailOptions): Promise<void>;
  /** Send multiple emails in one API call. Optional — falls back to sequential send() if not implemented. */
  sendBatch?(items: BatchEmailItem[]): Promise<BatchSendResult>;
  /** Test transport connectivity. */
  test(): Promise<{ success: boolean; message: string }>;
}
