import { IsString, IsOptional, IsEnum, IsArray, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChallengeDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] })
  @IsEnum({ BEGINNER: 'BEGINNER', INTERMEDIATE: 'INTERMEDIATE', ADVANCED: 'ADVANCED', EXPERT: 'EXPERT' })
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

  @ApiProperty({ enum: ['JAVASCRIPT', 'TYPESCRIPT', 'HTML', 'CSS'] })
  @IsEnum({ JAVASCRIPT: 'JAVASCRIPT', TYPESCRIPT: 'TYPESCRIPT', HTML: 'HTML', CSS: 'CSS' })
  language: 'JAVASCRIPT' | 'TYPESCRIPT' | 'HTML' | 'CSS';

  @ApiProperty()
  @IsString()
  starterCode: string;

  @ApiProperty()
  @IsString()
  solutionCode: string;

  @ApiProperty()
  testCases: object;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;
}

export class SubmitCodeDto {
  @ApiProperty()
  @IsString()
  code: string;
}

export class RunCodeDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty({ enum: ['JAVASCRIPT', 'TYPESCRIPT', 'HTML', 'CSS'] })
  @IsString()
  language: string;
}
