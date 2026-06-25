import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { AuthModule } from '../auth/auth.module';
import { CourseStructureModule } from '../course-structure/course-structure.module';

@Module({
  imports: [AuthModule, CourseStructureModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
// CoursePermissionsService is provided globally via PrismaModule
