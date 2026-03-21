import { IsString, IsEmail, MinLength, IsOptional, IsNotEmpty, Matches, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  password!: string;

  @IsOptional()
  @IsString()
  @IsIn(['de', 'en', 'es', 'fr', 'ar', 'tr', 'pl', 'ru'])
  locale?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  newPassword!: string;
}

export class VerifyEmailDto {
  @IsString()
  token!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['de', 'en', 'es', 'fr', 'ar', 'tr', 'pl', 'ru'])
  locale?: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  newPassword!: string;
}
