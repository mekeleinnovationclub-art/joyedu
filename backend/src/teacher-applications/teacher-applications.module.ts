import { Module } from '@nestjs/common';
import { TeacherApplicationsService } from './teacher-applications.service';
import { TeacherApplicationsController } from './teacher-applications.controller';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeacherApplicationsController],
  providers: [TeacherApplicationsService],
  exports: [TeacherApplicationsService],
})
export class TeacherApplicationsModule {}
