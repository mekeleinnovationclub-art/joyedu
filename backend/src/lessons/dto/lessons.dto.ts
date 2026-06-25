import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, Min, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const LESSON_TYPES = ['VIDEO', 'MARKDOWN', 'CODING'] as const;
type LessonType = 'VIDEO' | 'MARKDOWN' | 'CODING';

const LESSON_STATUS = ['DRAFT', 'PUBLISHED'] as const;
type LessonStatus = 'DRAFT' | 'PUBLISHED';

export class CreateLessonDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsString()
  subtopicId: string;

  @ApiProperty({ enum: LESSON_TYPES })
  @IsEnum(LESSON_TYPES)
  type: LessonType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  videoDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ enum: LESSON_STATUS })
  @IsOptional()
  @IsEnum(LESSON_STATUS)
  status?: LessonStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyTakeaways?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nextLessonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateLessonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  videoDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ enum: LESSON_STATUS })
  @IsOptional()
  @IsEnum(LESSON_STATUS)
  status?: LessonStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keyTakeaways?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nextLessonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
