import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const QUESTION_TYPES = ['MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'CODE', 'MATCHING', 'FILL_BLANK'] as const;
type QuestionType = 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'CODE' | 'MATCHING' | 'FILL_BLANK';

export class CreateQuestionDto {
  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty({ enum: QUESTION_TYPES })
  @IsEnum(QUESTION_TYPES)
  type: QuestionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;

  @ApiProperty()
  @IsString()
  correctAnswer: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ enum: QUESTION_TYPES })
  @IsOptional()
  @IsEnum(QUESTION_TYPES)
  type?: QuestionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateQuizDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  lessonId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  timeLimit?: number;

  @ApiPropertyOptional({ type: [CreateQuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}

export class UpdateQuizDto {
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
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  timeLimit?: number;
}

export class SubmitQuizDto {
  @ApiProperty()
  answers: Record<string, string>;
}

export class ReorderQuestionsDto {
  @ApiProperty()
  @IsString()
  quizId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  questionIds: string[];
}
