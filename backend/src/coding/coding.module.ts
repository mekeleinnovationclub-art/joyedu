import { Module } from '@nestjs/common';
import { CodingService } from './coding.service';
import { CodingController } from './coding.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CodingController],
  providers: [CodingService],
  exports: [CodingService],
})
export class CodingModule {}
