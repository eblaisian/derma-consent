import { IsEnum, IsString, IsOptional, IsObject, IsEmail, IsIn, IsNumber, IsArray, Matches, MaxLength } from 'class-validator';

export enum ConsentType {
  BOTOX = 'BOTOX',
  FILLER = 'FILLER',
  LASER = 'LASER',
  CHEMICAL_PEEL = 'CHEMICAL_PEEL',
  MICRONEEDLING = 'MICRONEEDLING',
  PRP = 'PRP',
}

export class CreateConsentDto {
  @IsOptional()
  @IsString()
  practiceId?: string;

  @IsEnum(ConsentType)
  type!: ConsentType;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsEmail()
  patientEmail?: string;

  @IsOptional()
  @IsString()
  patientPhone?: string;

  @IsOptional()
  @IsIn(['email', 'sms', 'whatsapp'])
  deliveryChannel?: 'email' | 'sms' | 'whatsapp';
}

export class SubmitConsentDto {
  @IsObject()
  encryptedResponses!: Record<string, unknown>;

  @IsString()
  encryptedSessionKey!: string;

  @IsOptional()
  @IsNumber()
  comprehensionScore?: number;

  @IsOptional()
  @IsArray()
  comprehensionAnswers?: Array<{ questionId: string; selectedIndex: number; correct: boolean }>;

  @IsOptional()
  @IsString()
  locale?: string;

  // Patient auto-creation fields (computed client-side from the personal details step)
  @IsOptional()
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  patientLookupHash?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  encryptedPatientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  encryptedPatientDob?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  encryptedPatientEmail?: string;
}

export class SendConsentCopyDto {
  @IsEmail()
  recipientEmail!: string;

  @IsOptional()
  @IsString()
  locale?: string;
}

export class RevokeConsentDto {
  @IsString()
  reason!: string;
}

export class ExplainConsentDto {
  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  mode?: 'full' | 'summary';
}
