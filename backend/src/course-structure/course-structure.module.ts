import { Module } from '@nestjs/common';
import { CourseStructureService } from './course-structure.service';
import { CourseStructureController } from './course-structure.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CourseStructureController],
  providers: [CourseStructureService],
  exports: [CourseStructureService],
})
export class CourseStructureModule {}
