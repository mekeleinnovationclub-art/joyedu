import { IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly'] })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  granularity?: 'daily' | 'weekly' | 'monthly';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
