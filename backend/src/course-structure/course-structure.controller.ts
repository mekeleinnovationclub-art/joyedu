import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CourseStructureService } from './course-structure.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateContentBlockDto,
  UpdateContentBlockDto,
  ReorderDto,
} from './dto/course-structure.dto';
import {
  CreateCourseWithStructureDto,
  UpdateCourseWithStructureDto,
} from './dto/course-builder.dto';

@ApiTags('Course Structure')
@Controller('course-structure')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('TEACHER', 'ADMIN')
@ApiBearerAuth()
export class CourseStructureController {
  constructor(private service: CourseStructureService) {}

  @Get('courses/:courseId/structure')
  @ApiOperation({ summary: 'Get full course structure' })
  getStructure(@Param('courseId') courseId: string, @CurrentUser() user: JwtPayload) {
    return this.service.getCourseStructure(courseId, user.sub, user.roles);
  }

  @Post('courses/builder')
  @ApiOperation({ summary: 'Create course with full structure' })
  createCourseWithStructure(@CurrentUser() user: JwtPayload, @Body() dto: CreateCourseWithStructureDto) {
    return this.service.createCourseWithStructure(user.sub, user.roles, dto);
  }

  @Put('courses/:courseId/builder')
  @ApiOperation({ summary: 'Update course with full structure' })
  updateCourseWithStructure(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCourseWithStructureDto,
  ) {
    return this.service.updateCourseWithStructure(courseId, user.sub, user.roles, dto);
  }

  @Get('courses/:courseId/validate')
  @ApiOperation({ summary: 'Validate course for publishing' })
  validateCourseForPublishing(@Param('courseId') courseId: string, @CurrentUser() user: JwtPayload) {
    return this.service.validateCourseForPublishing(courseId, user.sub, user.roles);
  }

  @Post('content-blocks')
  @ApiOperation({ summary: 'Create content block' })
  createBlock(@CurrentUser() user: JwtPayload, @Body() dto: CreateContentBlockDto) {
    return this.service.createContentBlock(user.sub, user.roles, dto);
  }

  @Put('content-blocks/:id')
  @ApiOperation({ summary: 'Update content block' })
  updateBlock(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: UpdateContentBlockDto) {
    return this.service.updateContentBlock(id, user.sub, user.roles, dto);
  }

  @Patch('content-blocks/:id')
  @ApiOperation({ summary: 'Partial update content block' })
  patchBlock(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: UpdateContentBlockDto) {
    return this.service.updateContentBlock(id, user.sub, user.roles, dto);
  }

  @Delete('content-blocks/:id')
  @ApiOperation({ summary: 'Delete content block' })
  deleteBlock(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.deleteContentBlock(id, user.sub, user.roles);
  }

  @Post('lessons/:lessonId/content-blocks/reorder')
  @ApiOperation({ summary: 'Reorder content blocks' })
  reorderContentBlocks(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ReorderDto,
  ) {
    return this.service.reorderContentBlocks(lessonId, user.sub, user.roles, dto.ids);
  }
}
