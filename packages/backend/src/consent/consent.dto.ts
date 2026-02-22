import { IsEnum, IsString, IsOptional, IsObject, IsEmail, IsIn, IsNumber, IsArray } from 'class-validator';

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

  @IsString()
  signatureData!: string; // base64 PNG from signature pad

  @IsOptional()
  @IsNumber()
  comprehensionScore?: number;

  @IsOptional()
  @IsArray()
  comprehensionAnswers?: Array<{ questionId: string; selectedIndex: number; correct: boolean }>;
}

export class RevokeConsentDto {
  @IsString()
  reason!: string;
}
