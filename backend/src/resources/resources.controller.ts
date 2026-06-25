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
import { ResourcesService } from './resources.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateResourceDto, UpdateResourceDto } from './dto/resources.dto';

@ApiTags('Resources')
@Controller('resources')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('TEACHER', 'ADMIN')
@ApiBearerAuth()
export class ResourcesController {
  constructor(private resourcesService: ResourcesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get resource by ID' })
  async findById(@Param('id') id: string) {
    return this.resourcesService.findById(id);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get resources by lesson' })
  async getByLesson(@Param('lessonId') lessonId: string) {
    return this.resourcesService.getByLesson(lessonId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get resources by course' })
  async getByCourse(@Param('courseId') courseId: string) {
    return this.resourcesService.getByCourse(courseId);
  }

  @Post()
  @ApiOperation({ summary: 'Create resource' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateResourceDto) {
    return this.resourcesService.create(user.sub, user.roles, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update resource' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, user.sub, user.roles, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete resource' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.resourcesService.delete(id, user.sub, user.roles);
  }
}
