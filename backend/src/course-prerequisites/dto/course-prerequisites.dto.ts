import { IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCoursePrerequisiteDto {
  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiProperty()
  @IsString()
  prerequisiteId: string;
}

export class BulkCoursePrerequisitesDto {
  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  prerequisiteIds: string[];
}

export class RemoveCoursePrerequisiteDto {
  @ApiProperty()
  @IsString()
  courseId: string;

  @ApiProperty()
  @IsString()
  prerequisiteId: string;
}
