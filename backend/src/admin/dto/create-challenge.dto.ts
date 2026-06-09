import { IsEnum, IsNotEmpty, IsArray, IsString, IsInt, IsOptional, Min, Max, IsNotEmptyObject, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DifficultyLevel, ChallengeLanguage } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateChallengeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: DifficultyLevel })
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @ApiProperty({ enum: ChallengeLanguage })
  @IsEnum(ChallengeLanguage)
  language: ChallengeLanguage;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  starterCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  solutionCode: string;

  @ApiProperty()
  @IsObject()
  testCases: any;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @ApiProperty({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  points?: number;
}
