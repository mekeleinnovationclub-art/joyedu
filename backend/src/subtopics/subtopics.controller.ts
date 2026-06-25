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
import { SubtopicsService } from './subtopics.service';
import { CreateSubtopicDto, UpdateSubtopicDto } from './dto/subtopics.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Subtopics')
@Controller('subtopics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('TEACHER', 'ADMIN')
@ApiBearerAuth()
export class SubtopicsController {
  constructor(private subtopicsService: SubtopicsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get subtopic by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.subtopicsService.findById(id, user.sub, user.roles);
  }

  @Post()
  @ApiOperation({ summary: 'Create a subtopic' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSubtopicDto) {
    return this.subtopicsService.create(user.sub, user.roles, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a subtopic' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSubtopicDto,
  ) {
    return this.subtopicsService.update(id, user.sub, user.roles, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update a subtopic (inline editing)' })
  async patch(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSubtopicDto,
  ) {
    return this.subtopicsService.update(id, user.sub, user.roles, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subtopic' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.subtopicsService.delete(id, user.sub, user.roles);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder subtopics' })
  async reorder(
    @CurrentUser() user: JwtPayload,
    @Body() body: { topicId: string; subtopicIds: string[] },
  ) {
    return this.subtopicsService.reorder(body.topicId, user.sub, user.roles, body.subtopicIds);
  }
}
