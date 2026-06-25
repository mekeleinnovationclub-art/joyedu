import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, CourseFilterDto } from './dto/courses.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  private readonly logger = new Logger(CoursesController.name);

  constructor(private coursesService: CoursesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published courses with filters' })
  async findAll(@Query() filters: CourseFilterDto) {
    return this.coursesService.findAll(filters);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured courses' })
  async getFeatured() {
    return this.coursesService.getFeaturedCourses();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Get('instructor/my-courses')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get instructor courses' })
  async getInstructorCourses(@CurrentUser() user: JwtPayload) {
    return this.coursesService.getInstructorCourses(user.sub);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER')
  @Get('instructor/students')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get instructor students across all courses' })
  async getInstructorStudents(@CurrentUser() user: JwtPayload) {
    return this.coursesService.getInstructorStudents(user.sub);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER')
  @Get('instructor/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get teacher dashboard stats' })
  async getTeacherDashboard(@CurrentUser() user: JwtPayload) {
    return this.coursesService.getTeacherDashboard(user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('student/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get student dashboard stats' })
  async getStudentDashboard(@CurrentUser() user: JwtPayload) {
    return this.coursesService.getStudentDashboard(user.sub);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get course by slug' })
  async findBySlug(@Param('slug') slug: string, @CurrentUser() user?: JwtPayload) {
    return this.coursesService.findBySlug(slug, user?.sub, user?.roles);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get course by ID (teacher/admin)' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.coursesService.findById(id, user.sub, user.roles);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course (teacher/admin)' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCourseDto) {
    this.logger.log(`Creating course - User: ${user.sub}, Payload: ${JSON.stringify(dto)}`);
    return this.coursesService.create(user.sub, user.roles, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post(':id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish course (teacher/admin)' })
  async publish(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.coursesService.publish(id, user.sub, user.roles);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Patch(':id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish course (PATCH alias)' })
  async publishPatch(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.coursesService.publish(id, user.sub, user.roles);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post(':id/unpublish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpublish course' })
  async unpublish(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.coursesService.unpublish(id, user.sub, user.roles);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post(':id/review')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit course for review' })
  async submitForReview(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.coursesService.submitForReview(id, user.sub, user.roles);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post(':id/archive')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive course (teacher/admin)' })
  async archive(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.coursesService.archive(id, user.sub, user.roles);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course (teacher/admin)' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, user.sub, user.roles, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Partial update course (teacher/admin)' })
  async patch(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, user.sub, user.roles, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete course (teacher/admin)' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.coursesService.delete(id, user.sub, user.roles);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Get(':id/structure')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full course structure' })
  async getStructure(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.coursesService.getCourseStructure(id, user.sub, user.roles);
  }
}
