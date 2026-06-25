import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CoursePermissionsService } from './services/course-permissions.service';

@Global()
@Module({
  providers: [PrismaService, CoursePermissionsService],
  exports: [PrismaService, CoursePermissionsService],
})
export class PrismaModule {}
