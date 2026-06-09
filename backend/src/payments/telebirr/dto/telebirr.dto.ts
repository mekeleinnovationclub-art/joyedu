import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTelebirrOrderDto {
  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  title: string;
}

export class TelebirrWebhookDto {
  @ApiProperty()
  @IsString()
  merch_order_id: string;

  @ApiProperty()
  @IsString()
  trade_status: string;

  @ApiProperty()
  @IsString()
  total_amount: string;

  @ApiProperty()
  @IsString()
  payment_order_id: string;

  @ApiProperty()
  @IsString()
  sign: string;

  @ApiProperty()
  @IsString()
  sign_type: string;
}

export class QueryTelebirrOrderDto {
  @ApiProperty()
  @IsString()
  merchantOrderId: string;
}

export class RefundTelebirrOrderDto {
  @ApiProperty()
  @IsString()
  merchantOrderId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
