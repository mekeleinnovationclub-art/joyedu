import { IsOptional, IsString, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateProfileDto } from '../../users/dto/users.dto';

export class UpdateAuthProfileDto extends UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  notifications?: Record<string, boolean>;
}
