import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  Min,
  IsUrl,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CourseStatus } from '@prisma/client';

const DIFFICULTY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;
type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

const CONTENT_BLOCK_TYPES = [
  'RICH_TEXT',
  'MARKDOWN',
  'CODE',
  'IMAGE',
  'VIDEO',
  'FILE',
  'EMBEDDED_FILE',
  'EXTERNAL_LINK',
  'CALLOUT',
  'NOTE',
  'SUMMARY',
  'EXAMPLE',
  'ASSIGNMENT',
  'EXERCISE',
  'QUIZ',
  'CODING_CHALLENGE',
] as const;
type ContentBlockType =
  | 'RICH_TEXT'
  | 'MARKDOWN'
  | 'CODE'
  | 'IMAGE'
  | 'VIDEO'
  | 'FILE'
  | 'EMBEDDED_FILE'
  | 'EXTERNAL_LINK'
  | 'CALLOUT'
  | 'NOTE'
  | 'SUMMARY'
  | 'EXAMPLE'
  | 'ASSIGNMENT'
  | 'EXERCISE'
  | 'QUIZ'
  | 'CODING_CHALLENGE';

const LESSON_TYPES = ['VIDEO', 'MARKDOWN', 'CODING'] as const;
type LessonType = 'VIDEO' | 'MARKDOWN' | 'CODING';

// Content Block DTOs
export class ContentBlockDto {
  @ApiProperty()
  @IsString()
  type: ContentBlockType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty()
  @IsObject()
  content: Record<string, unknown>;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class CreateContentBlockDto extends ContentBlockDto {}
export class UpdateContentBlockDto extends ContentBlockDto {}

// Quiz Question DTO
export class QuizQuestionDto {
  @ApiProperty()
  @IsString()
  question: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiProperty()
  @IsString()
  correctAnswer: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;
}

// Exercise Test DTO
export class ExerciseTestDto {
  @ApiProperty()
  @IsString()
  input: string;

  @ApiProperty()
  @IsString()
  expectedOutput: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}

// Quiz DTOs
export class QuizDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description?: string;

  @ApiProperty({ type: [QuizQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  passingScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeLimit?: number;
}

export class CreateQuizDto extends QuizDto {}
export class UpdateQuizDto extends QuizDto {}

// Exercise DTOs
export class ExerciseDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [ExerciseTestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseTestDto)
  tests: ExerciseTestDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  starterCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  solutionCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

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

export class CreateExerciseDto extends ExerciseDto {}
export class UpdateExerciseDto extends ExerciseDto {}

// Lesson DTOs
export class LessonDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsEnum(LESSON_TYPES)
  type: LessonType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  videoDuration?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

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

  @ApiPropertyOptional({ type: [ContentBlockDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentBlockDto)
  contentBlocks?: ContentBlockDto[];

  @ApiPropertyOptional({ type: [QuizDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizDto)
  quizzes?: QuizDto[];

  @ApiPropertyOptional({ type: [ExerciseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises?: ExerciseDto[];
}

export class CreateLessonDto extends LessonDto {}
export class UpdateLessonDto extends LessonDto {}

// Subtopic DTOs
export class SubtopicDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

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
  nextSubtopicId?: string;

  @ApiPropertyOptional({ type: [LessonDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonDto)
  lessons?: LessonDto[];
}

export class CreateSubtopicDto extends SubtopicDto {}
export class UpdateSubtopicDto extends SubtopicDto {}

// Topic DTOs
export class TopicDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ type: [SubtopicDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtopicDto)
  subtopics?: SubtopicDto[];
}

export class CreateTopicDto extends TopicDto {}
export class UpdateTopicDto extends TopicDto {}

// Full Course Builder DTO
export class CourseBuilderDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountPrice?: number;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningGoals?: string[];

  @ApiPropertyOptional({ type: [String] })
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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoKeywords?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  certificateEligible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiProperty({ type: [TopicDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicDto)
  topics: TopicDto[];
}

export class CreateCourseWithStructureDto extends CourseBuilderDto {}
export class UpdateCourseWithStructureDto extends CourseBuilderDto {}
