import { IsString, IsOptional } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  priceId!: string;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
