import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CoursePrerequisitesService } from './course-prerequisites.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateCoursePrerequisiteDto,
  BulkCoursePrerequisitesDto,
  RemoveCoursePrerequisiteDto,
} from './dto/course-prerequisites.dto';

@ApiTags('Course Prerequisites')
@Controller('course-prerequisites')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('TEACHER', 'ADMIN')
@ApiBearerAuth()
export class CoursePrerequisitesController {
  constructor(private service: CoursePrerequisitesService) {}

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get prerequisites for a course' })
  async getByCourse(@Param('courseId') courseId: string) {
    return this.service.getByCourse(courseId);
  }

  @Get('available/:courseId')
  @ApiOperation({ summary: 'Get available courses that can be prerequisites' })
  async getPrerequisiteCourses(@Param('courseId') courseId: string) {
    return this.service.getPrerequisiteCourses(courseId);
  }

  @Post()
  @ApiOperation({ summary: 'Add prerequisite to course' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCoursePrerequisiteDto) {
    return this.service.create(user.sub, user.roles, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Add multiple prerequisites to course' })
  async bulkCreate(@CurrentUser() user: JwtPayload, @Body() dto: BulkCoursePrerequisitesDto) {
    return this.service.bulkCreate(user.sub, user.roles, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Remove prerequisite from course' })
  async remove(@CurrentUser() user: JwtPayload, @Body() dto: RemoveCoursePrerequisiteDto) {
    return this.service.remove(user.sub, user.roles, dto);
  }
}
