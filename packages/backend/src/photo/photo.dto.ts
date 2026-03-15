import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum PhotoType {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
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

export class UploadPhotoDto {
  @IsString()
  patientId!: string;

  @IsEnum(PhotoType)
  type!: PhotoType;

  @IsEnum(BodyRegion)
  bodyRegion!: BodyRegion;

  @IsString()
  encryptedSessionKey!: string;

  @IsDateString()
  takenAt!: string;

  @IsOptional()
  @IsString()
  consentFormId?: string;

  @IsOptional()
  @IsString()
  treatmentPlanId?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @IsObject()
  encryptedMetadata?: { iv: string; ciphertext: string };

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  photoConsentGranted?: boolean;
}

export class UpdatePhotoConsentDto {
  @IsBoolean()
  photoConsentGranted!: boolean;
}
