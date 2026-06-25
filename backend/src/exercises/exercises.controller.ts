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
import { ExercisesService } from './exercises.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateExerciseDto, UpdateExerciseDto } from './dto/exercises.dto';

@ApiTags('Exercises')
@Controller('exercises')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('TEACHER', 'ADMIN')
@ApiBearerAuth()
export class ExercisesController {
  constructor(private service: ExercisesService) {}

  @Post()
  @ApiOperation({ summary: 'Create exercise' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateExerciseDto) {
    return this.service.create(user.sub, user.roles, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exercise by ID' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get exercises by lesson' })
  getByLesson(@Param('lessonId') lessonId: string) {
    return this.service.getByLesson(lessonId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update exercise' })
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: UpdateExerciseDto) {
    return this.service.update(id, user.sub, user.roles, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update exercise' })
  patch(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: UpdateExerciseDto) {
    return this.service.update(id, user.sub, user.roles, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete exercise' })
  delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.delete(id, user.sub, user.roles);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder exercises in a lesson' })
  reorder(@CurrentUser() user: JwtPayload, @Body() body: { lessonId: string; exerciseIds: string[] }) {
    return this.service.reorder(body.lessonId, user.sub, user.roles, body.exerciseIds);
  }
}
