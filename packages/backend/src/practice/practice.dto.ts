import { IsString, IsEmail, IsObject } from 'class-validator';

export class CreatePracticeDto {
  @IsString()
  name!: string;

  @IsEmail()
  dsgvoContact!: string;

  @IsObject()
  publicKey!: Record<string, unknown>;

  @IsObject()
  encryptedPrivKey!: Record<string, unknown>;
}
