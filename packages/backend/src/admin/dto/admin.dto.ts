import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, IsEmail, IsArray, ArrayMinSize, ArrayMaxSize, MaxLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum SubscriptionPlanEnum {
  FREE_TRIAL = 'FREE_TRIAL',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export class UpdateConfigDto {
  @IsString()
  @IsNotEmpty()
  value!: string;
}

export class OverrideSubscriptionDto {
  @IsEnum(SubscriptionPlanEnum)
  plan!: SubscriptionPlanEnum;
}

export class SendAdminEmailDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  to!: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  html!: string;

  @IsOptional()
  @IsEmail()
  fromAddress?: string;
}

export class PracticesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 25;

  @IsOptional()
  @IsString()
  search?: string;
}
