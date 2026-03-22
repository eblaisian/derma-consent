import { IsObject, IsOptional, IsString, IsEmail } from 'class-validator';

export class GeneratePdfDto {
  @IsObject()
  formData!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  signatureData?: string;

  @IsOptional()
  @IsString()
  patientName?: string;

  @IsOptional()
  @IsString()
  patientDob?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsEmail()
  patientEmail?: string;
}
