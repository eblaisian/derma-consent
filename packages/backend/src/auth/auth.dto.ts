import { IsString, IsEmail, IsOptional } from 'class-validator';

export class SyncUserDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsString()
  provider!: string;

  @IsString()
  providerAccountId!: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  expiresAt?: number;
}
