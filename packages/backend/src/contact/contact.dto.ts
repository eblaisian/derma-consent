import { IsString, IsEmail, IsOptional, MaxLength, MinLength } from 'class-validator';

export class ContactFormDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  practice?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;
}
