import { IsString, IsOptional, IsInt, Min, Max, IsArray } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  defaultConsentExpiry?: number;

  @IsOptional()
  @IsArray()
  enabledConsentTypes?: string[];

  @IsOptional()
  @IsString()
  brandColor?: string;
}
