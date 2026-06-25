import {
  IsString,
  IsOptional,
  IsInt,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateResourceDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fileSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;
}

export class UpdateResourceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fileSize?: number;
}
