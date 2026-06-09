import { IsString, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnrollDto {
  @ApiProperty()
  @IsString()
  courseId: string;
}

export class UpdateProgressDto {
  @ApiProperty()
  @IsString()
  lessonId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  watchTime?: number;
}
