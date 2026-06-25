import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CourseStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

const COURSE_STATUS_VALUES = ['DRAFT', 'REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED', 'flagged'] as const;

export class AdminCourseFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({ description: 'Filter flagged courses' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  flagged?: boolean;
}
