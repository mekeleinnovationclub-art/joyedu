import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto, SubmitQuizDto } from './dto/quizzes.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a quiz' })
  async create(@Body() dto: CreateQuizDto) {
    return this.quizzesService.create(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quiz by ID' })
  async findById(@Param('id') id: string) {
    return this.quizzesService.findById(id);
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
