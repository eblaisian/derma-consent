import { IsIn, IsString, IsOptional, MaxLength } from 'class-validator';

export const COMMUNICATION_CONTEXTS = [
  'CONSENT_REMINDER',
  'APPOINTMENT_CONFIRMATION',
  'APPOINTMENT_REMINDER',
  'FOLLOW_UP',
  'TREATMENT_PREPARATION',
  'RESULT_READY',
  'GENERAL',
] as const;

export type CommunicationContext = (typeof COMMUNICATION_CONTEXTS)[number];

const SUPPORTED_LOCALES = ['de', 'en', 'es', 'fr', 'ar', 'tr', 'pl', 'ru'];

export class GenerateDraftDto {
  @IsIn(COMMUNICATION_CONTEXTS)
  context!: CommunicationContext;

  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  locale?: string;
}

export class SendMessageDto {
  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsIn(['email', 'sms'])
  channel!: 'email' | 'sms';

  @IsString()
  recipient!: string;

  @IsOptional()
  @IsString()
  subject?: string;
}
