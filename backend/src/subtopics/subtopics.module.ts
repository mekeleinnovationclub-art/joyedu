import { Module } from '@nestjs/common';
import { SubtopicsController } from './subtopics.controller';
import { SubtopicsService } from './subtopics.service';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubtopicsController],
  providers: [SubtopicsService],
  exports: [SubtopicsService],
})
export class SubtopicsModule {}
