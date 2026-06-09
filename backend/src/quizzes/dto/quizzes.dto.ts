import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty({ enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'CODE'] })
  @IsEnum({ MULTIPLE_CHOICE: 'MULTIPLE_CHOICE', TRUE_FALSE: 'TRUE_FALSE', SHORT_ANSWER: 'SHORT_ANSWER', CODE: 'CODE' })
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'CODE';

  @ApiPropertyOptional()
  @IsOptional()
  options?: object;

  @ApiProperty()
  @IsString()
  correctAnswer: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;
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
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
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

export class SubmitQuizDto {
  @ApiProperty()
  answers: Record<string, string>;
}
