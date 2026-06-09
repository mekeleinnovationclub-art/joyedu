import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CodingService } from './coding.service';
import { CreateChallengeDto, SubmitCodeDto, RunCodeDto } from './dto/coding.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Coding')
@Controller('coding')
export class CodingController {
  constructor(private codingService: CodingService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('challenges')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a coding challenge' })
  async createChallenge(@Body() dto: CreateChallengeDto) {
    return this.codingService.createChallenge(dto);
  }

  @Public()
  @Get('challenges')
  @ApiOperation({ summary: 'List coding challenges' })
  async findAll(
    @Query() query: PaginationDto,
    @Query('difficulty') difficulty?: string,
    @Query('language') language?: string,
  ) {
    return this.codingService.findAll({ ...query, difficulty, language });
  }

  @Public()
  @Get('challenges/:slug')
  @ApiOperation({ summary: 'Get challenge by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.codingService.findBySlug(slug);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('challenges/:id/submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit code for a challenge' })
  async submitCode(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SubmitCodeDto,
  ) {
    return this.codingService.submitCode(id, user.sub, dto);
  }

  @Public()
  @Post('run')
  @ApiOperation({ summary: 'Run code in sandbox' })
  async runCode(@Body() dto: RunCodeDto) {
    return this.codingService.runCode(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('submissions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user submissions' })
  async getUserSubmissions(
    @CurrentUser() user: JwtPayload,
    @Query('challengeId') challengeId?: string,
  ) {
    return this.codingService.getUserSubmissions(user.sub, challengeId);
  }
}
