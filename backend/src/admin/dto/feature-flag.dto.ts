import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MinLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const ENVIRONMENTS = ['DEVELOPMENT', 'STAGING', 'PRODUCTION'] as const;

export class CreateFeatureFlagDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_-]+$/, { message: 'Key can only contain lowercase letters, numbers, underscores, and hyphens' })
  key: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isBeta?: boolean;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isMaintenance?: boolean;

  @ApiProperty({ default: 'PRODUCTION', required: false })
  @IsOptional()
  @IsString()
  @IsIn(ENVIRONMENTS)
  environment?: string;
}

export class UpdateFeatureFlagDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isBeta?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isMaintenance?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsIn(ENVIRONMENTS)
  environment?: string;
}
