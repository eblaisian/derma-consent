import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsDateString,
} from 'class-validator';

export enum ConsentType {
  BOTOX = 'BOTOX',
  FILLER = 'FILLER',
  LASER = 'LASER',
  CHEMICAL_PEEL = 'CHEMICAL_PEEL',
  MICRONEEDLING = 'MICRONEEDLING',
  PRP = 'PRP',
}

export enum BodyRegion {
  FOREHEAD = 'FOREHEAD',
  GLABELLA = 'GLABELLA',
  PERIORBITAL = 'PERIORBITAL',
  CHEEKS = 'CHEEKS',
  NASOLABIAL = 'NASOLABIAL',
  LIPS = 'LIPS',
  CHIN = 'CHIN',
  JAWLINE = 'JAWLINE',
  NECK = 'NECK',
  DECOLLETE = 'DECOLLETE',
  HANDS = 'HANDS',
  SCALP = 'SCALP',
  OTHER = 'OTHER',
}

// --- Treatment Plans ---

export class CreateTreatmentPlanDto {
  @IsString()
  patientId!: string;

  @IsEnum(ConsentType)
  type!: ConsentType;

  @IsString()
  encryptedSessionKey!: string;

  @IsObject()
  encryptedData!: { iv: string; ciphertext: string };

  @IsOptional()
  @IsObject()
  encryptedSummary?: { iv: string; ciphertext: string };

  @IsOptional()
  @IsString()
  consentFormId?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsDateString()
  performedAt?: string;
}

export class UpdateTreatmentPlanDto {
  @IsOptional()
  @IsString()
  encryptedSessionKey?: string;

  @IsOptional()
  @IsObject()
  encryptedData?: { iv: string; ciphertext: string };

  @IsOptional()
  @IsObject()
  encryptedSummary?: { iv: string; ciphertext: string };

  @IsOptional()
  @IsDateString()
  performedAt?: string;
}

// --- Templates ---

export class CreateTemplateDto {
  @IsString()
  name!: string;

  @IsEnum(ConsentType)
  type!: ConsentType;

  @IsEnum(BodyRegion)
  bodyRegion!: BodyRegion;

  @IsObject()
  templateData!: Record<string, unknown>;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ConsentType)
  type?: ConsentType;

  @IsOptional()
  @IsEnum(BodyRegion)
  bodyRegion?: BodyRegion;

  @IsOptional()
  @IsObject()
  templateData?: Record<string, unknown>;
}
