import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ enum: ['STRIPE', 'TELEBIRR', 'WALLET'] })
  @IsOptional()
  @IsEnum(['STRIPE', 'TELEBIRR', 'WALLET'])
  paymentMethod?: 'STRIPE' | 'TELEBIRR' | 'WALLET';
}

export class CreateSubscriptionDto {
  @ApiProperty({ enum: ['BASIC', 'PRO', 'ENTERPRISE'] })
  @IsString()
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
}
