import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PayoutStatus } from '@prisma/client';

export class PayoutActionDto {
  @ApiProperty({ enum: PayoutStatus })
  @IsEnum(PayoutStatus)
  @IsIn(['COMPLETED', 'PROCESSING', 'FAILED'])
  status: PayoutStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
