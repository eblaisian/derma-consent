import { IsString, Length } from 'class-validator';

export class TwoFactorTokenDto {
  @IsString()
  @Length(6, 6)
  token!: string;
}

export class TwoFactorVerifyLoginDto {
  @IsString()
  tempToken!: string;

  @IsString()
  @Length(6, 6)
  token!: string;
}
