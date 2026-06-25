import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BulkPlatformSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  siteDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maxUploadSize?: string;
}
