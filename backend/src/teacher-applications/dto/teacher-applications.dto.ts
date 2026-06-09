import { IsString, IsArray, IsOptional, IsUrl, MinLength } from 'class-validator';

export class CreateTeacherApplicationDto {
  @IsString()
  @MinLength(50)
  bio: string;

  @IsArray()
  @IsString({ each: true })
  expertise: string[];

  @IsString()
  @MinLength(50)
  experience: string;

  @IsArray()
  @IsUrl({}, { each: true })
  portfolioLinks: string[];

  @IsOptional()
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
}

export class UpdateTeacherApplicationDto {
  @IsOptional()
  @IsString()
  @MinLength(50)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertise?: string[];

  @IsOptional()
  @IsString()
  @MinLength(50)
  experience?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  portfolioLinks?: string[];

  @IsOptional()
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
}
