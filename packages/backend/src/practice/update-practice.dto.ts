import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdatePracticeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  dsgvoContact?: string;
}
