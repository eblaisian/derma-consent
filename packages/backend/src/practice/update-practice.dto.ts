import { IsString, IsOptional, IsEmail, Matches } from 'class-validator';

export class UpdatePracticeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  dsgvoContact?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  houseNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, { message: 'Postal code must be exactly 5 digits' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  practiceEmail?: string;

  @IsOptional()
  @IsString()
  website?: string;
}
