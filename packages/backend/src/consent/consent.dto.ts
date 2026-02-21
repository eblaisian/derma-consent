import { IsEnum, IsString, IsOptional, IsObject, IsEmail } from 'class-validator';

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
}

export class SubmitConsentDto {
  @IsObject()
  encryptedResponses!: Record<string, unknown>;

  @IsString()
  encryptedSessionKey!: string;

  @IsString()
  signatureData!: string; // base64 PNG from signature pad
}

export class RevokeConsentDto {
  @IsString()
  reason!: string;
}
