import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;
}

export class CreateSubscriptionDto {
  @ApiProperty({ enum: ['BASIC', 'PRO', 'ENTERPRISE'] })
  @IsString()
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
}
