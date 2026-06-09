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
import { LessonsService } from './lessons.service';
import { CreateLessonDto, UpdateLessonDto } from './dto/lessons.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get lesson by ID' })
  async findById(@Param('id') id: string) {
    return this.lessonsService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a lesson' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateLessonDto) {
    return this.lessonsService.create(user.sub, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER')
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a lesson' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, user.sub, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a lesson' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.lessonsService.delete(id, user.sub);
  }
}
