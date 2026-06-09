import { IsNotEmpty, IsOptional, IsString, Matches, IsIn, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const VALID_CATEGORIES = ['site', 'branding', 'payment', 'email', 'security', 'platform'];

export class CreatePlatformSettingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_.-]+$/, { message: 'Key can only contain lowercase letters, numbers, dots, underscores, and hyphens' })
  key: string;

  @ApiProperty()
  @IsObject()
  value: any;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_CATEGORIES)
  category: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePlatformSettingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  value?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsIn(VALID_CATEGORIES)
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
