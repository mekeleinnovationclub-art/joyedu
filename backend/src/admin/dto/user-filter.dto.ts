import { IsOptional, IsEnum, IsBoolean, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Type } from 'class-transformer';

export class UserFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'email', 'firstName', 'lastName'])
  sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'firstName' | 'lastName';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['newest', 'oldest'])
  dateSort?: 'newest' | 'oldest';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  nameSort?: 'asc' | 'desc';
}
