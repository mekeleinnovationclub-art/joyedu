import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

const ENTITY_TYPES = ['User', 'Course', 'Lesson', 'Quiz', 'Category', 'Review', 'Enrollment', 'Transaction', 'Topic', 'Subtopic', 'ContentBlock'] as const;
type EntityType = 'User' | 'Course' | 'Lesson' | 'Quiz' | 'Category' | 'Review' | 'Enrollment' | 'Transaction' | 'Topic' | 'Subtopic' | 'ContentBlock';

export class RestoreFromAuditDto {
  @ApiProperty()
  @IsString()
  auditLogId: string;
}

export class GetAuditHistoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ENTITY_TYPES)
  entityType?: EntityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;
}
