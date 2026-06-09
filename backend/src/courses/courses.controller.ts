import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
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
  @Roles('TEACHER')
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

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get course by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.coursesService.findBySlug(slug);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER')
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get course by ID (teacher)' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.coursesService.findById(id, user.sub, user.roles);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new course (teacher)' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(user.sub, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER')
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course (teacher)' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, user.sub, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER')
  @Post(':id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish course (teacher)' })
  async publish(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.coursesService.publish(id, user.sub);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER')
  @Post(':id/archive')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive course (teacher)' })
  async archive(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.coursesService.archive(id, user.sub);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete course (teacher)' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.coursesService.delete(id, user.sub);
  }
}
