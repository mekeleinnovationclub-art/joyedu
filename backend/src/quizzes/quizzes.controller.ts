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
import { QuizzesService } from './quizzes.service';
import {
  CreateQuizDto,
  UpdateQuizDto,
  SubmitQuizDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  ReorderQuestionsDto,
} from './dto/quizzes.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a quiz' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateQuizDto) {
    return this.quizzesService.create(user.sub, user.roles, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a quiz' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzesService.update(id, user.sub, user.roles, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Partial update a quiz (inline editing)' })
  async patch(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzesService.update(id, user.sub, user.roles, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a quiz' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.quizzesService.delete(id, user.sub, user.roles);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Get('lesson/:lessonId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quizzes by lesson' })
  async getByLesson(@Param('lessonId') lessonId: string) {
    return this.quizzesService.getByLesson(lessonId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quiz by ID' })
  async findById(@Param('id') id: string) {
    return this.quizzesService.findById(id);
  }

  // Question management endpoints
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post(':quizId/questions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add question to quiz' })
  async createQuestion(
    @CurrentUser() user: JwtPayload,
    @Param('quizId') quizId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.quizzesService.createQuestion(quizId, user.sub, user.roles, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Put('questions/:questionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update question' })
  async updateQuestion(
    @CurrentUser() user: JwtPayload,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.quizzesService.updateQuestion(questionId, user.sub, user.roles, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Patch('questions/:questionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Partial update question (inline editing)' })
  async patchQuestion(
    @CurrentUser() user: JwtPayload,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.quizzesService.updateQuestion(questionId, user.sub, user.roles, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Delete('questions/:questionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete question' })
  async deleteQuestion(
    @CurrentUser() user: JwtPayload,
    @Param('questionId') questionId: string,
  ) {
    return this.quizzesService.deleteQuestion(questionId, user.sub, user.roles);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post('questions/reorder')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder questions in quiz' })
  async reorderQuestions(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ReorderQuestionsDto,
  ) {
    return this.quizzesService.reorderQuestions(user.sub, user.roles, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit quiz answers' })
  async submit(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.quizzesService.submit(id, user.sub, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/attempts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quiz attempts' })
  async getAttempts(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.quizzesService.getAttempts(id, user.sub);
  }
}
