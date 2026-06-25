import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '@prisma/client';
import { Type } from 'class-transformer';

const DIFFICULTY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;
type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previewVideo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  promotionalVideo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: DIFFICULTY_LEVELS })
  @IsOptional()
  @IsEnum(DIFFICULTY_LEVELS)
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningGoals?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  certificateEligible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFlagged?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  flaggedReason?: string;
}

export class UpdateCourseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previewVideo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  promotionalVideo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountPrice?: number;

  @ApiPropertyOptional({ enum: DIFFICULTY_LEVELS })
  @IsOptional()
  @IsEnum(DIFFICULTY_LEVELS)
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningGoals?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @ApiPropertyOptional({ enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  certificateEligible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFlagged?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  flaggedReason?: string;
}

export class CourseFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: DIFFICULTY_LEVELS })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
