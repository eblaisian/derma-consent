export type SendStatus = 'pending' | 'sent' | 'failed';

export interface Recipient {
  email: string;
  fields: Record<string, string>;
  status: SendStatus;
  warnings: string[];
}

export const BATCH_SIZE = 10;
