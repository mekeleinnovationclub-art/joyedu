import {
  IsString,
  IsOptional,
  IsArray,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExerciseDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  solution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @ApiProperty()
  @IsString()
  lessonId: string;
}

export class UpdateExerciseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  solution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  fileUrl?: string;
}
