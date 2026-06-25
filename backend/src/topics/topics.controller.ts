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
import { TopicsService } from './topics.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topics.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Topics')
@Controller('topics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('TEACHER', 'ADMIN')
@ApiBearerAuth()
export class TopicsController {
  constructor(private topicsService: TopicsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get topic by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.topicsService.findById(id, user.sub, user.roles);
  }

  @Post()
  @ApiOperation({ summary: 'Create a topic' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTopicDto) {
    return this.topicsService.create(user.sub, user.roles, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a topic' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.topicsService.update(id, user.sub, user.roles, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update a topic (inline editing)' })
  async patch(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.topicsService.update(id, user.sub, user.roles, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a topic' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.topicsService.delete(id, user.sub, user.roles);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder topics' })
  async reorder(
    @CurrentUser() user: JwtPayload,
    @Body() body: { courseId: string; topicIds: string[] },
  ) {
    return this.topicsService.reorder(body.courseId, user.sub, user.roles, body.topicIds);
  }
}
