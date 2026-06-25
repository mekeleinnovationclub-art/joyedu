import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CourseMediaService } from './course-media.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateCourseMediaDto,
  UpdateCourseMediaDto,
  ReorderCourseMediaDto,
} from './dto/course-media.dto';

@ApiTags('Course Media')
@Controller('course-media')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('TEACHER', 'ADMIN')
@ApiBearerAuth()
export class CourseMediaController {
  constructor(private service: CourseMediaService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get course media by ID' })
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all media for a course' })
  async getByCourse(@Param('courseId') courseId: string) {
    return this.service.getByCourse(courseId);
  }

  @Post()
  @ApiOperation({ summary: 'Create course media' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCourseMediaDto) {
    return this.service.create(user.sub, user.roles, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update course media' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCourseMediaDto,
  ) {
    return this.service.update(id, user.sub, user.roles, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete course media' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.delete(id, user.sub, user.roles);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder course media' })
  async reorder(@CurrentUser() user: JwtPayload, @Body() dto: ReorderCourseMediaDto) {
    return this.service.reorder(user.sub, user.roles, dto);
  }
}
