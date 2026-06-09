import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChatDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  memberIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  chatId: string;

  @ApiProperty()
  @IsString()
  content: string;
}
