import { IsEnum, IsOptional, IsArray, IsString, IsInt, Min, Max, IsObject, IsNotEmptyObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DifficultyLevel, ChallengeLanguage } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateChallengeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DifficultyLevel, required: false })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @ApiProperty({ enum: ChallengeLanguage, required: false })
  @IsOptional()
  @IsEnum(ChallengeLanguage)
  language?: ChallengeLanguage;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  starterCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  solutionCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  testCases?: any;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  points?: number;
}
