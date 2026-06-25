import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  discount: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPercent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxUses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPercent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxUses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ValidateCouponDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;
}
