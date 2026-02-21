import { IsString, IsOptional } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  encryptedName!: string;

  @IsOptional()
  @IsString()
  encryptedDob?: string;

  @IsOptional()
  @IsString()
  encryptedEmail?: string;

  @IsString()
  lookupHash!: string;
}
