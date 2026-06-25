import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentBlockType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateContentBlockDto {
  @ApiProperty({ enum: ContentBlockType })
  @IsEnum(ContentBlockType)
  type: ContentBlockType;

  @ApiProperty()
  @IsString()
  lessonId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty()
  @IsObject()
  content: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateContentBlockDto {
  @ApiPropertyOptional({ enum: ContentBlockType })
  @IsOptional()
  @IsEnum(ContentBlockType)
  type?: ContentBlockType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ReorderDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
