import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

const MEDIA_TYPES = ['IMAGE', 'VIDEO', 'DOCUMENT'] as const;
type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export class CreateCourseMediaDto {
  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiProperty({ enum: MEDIA_TYPES })
  @IsEnum(MEDIA_TYPES)
  type: MediaType;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCourseMediaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(MEDIA_TYPES)
  type?: MediaType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ReorderCourseMediaDto {
  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiProperty({ type: [String] })
  mediaIds: string[];
}
