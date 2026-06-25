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
import { AnnouncementsService } from './announcements.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcements.dto';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('TEACHER', 'ADMIN')
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private service: AnnouncementsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get announcement by ID' })
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all announcements for a course' })
  async getByCourse(@Param('courseId') courseId: string) {
    return this.service.getByCourse(courseId);
  }

  @Post()
  @ApiOperation({ summary: 'Create announcement' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAnnouncementDto) {
    return this.service.create(user.sub, user.roles, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update announcement' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.service.update(id, user.sub, user.roles, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete announcement' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.delete(id, user.sub, user.roles);
  }
}
