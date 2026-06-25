import { Module } from '@nestjs/common';
import { CourseMediaService } from './course-media.service';
import { CourseMediaController } from './course-media.controller';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CourseMediaController],
  providers: [CourseMediaService],
  exports: [CourseMediaService],
})
export class CourseMediaModule {}
