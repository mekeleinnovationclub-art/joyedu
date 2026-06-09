import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TeacherApplicationsService } from './teacher-applications.service';
import { CreateTeacherApplicationDto, UpdateTeacherApplicationDto } from './dto/teacher-applications.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Teacher Applications')
@Controller('teacher-applications')
export class TeacherApplicationsController {
  constructor(private readonly teacherApplicationsService: TeacherApplicationsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a teacher application' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTeacherApplicationDto) {
    return this.teacherApplicationsService.create(user.sub, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user teacher application' })
  async findMyApplication(@CurrentUser() user: JwtPayload) {
    return this.teacherApplicationsService.findByUserId(user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user teacher application status' })
  async getMyStatus(@CurrentUser() user: JwtPayload) {
    return this.teacherApplicationsService.getStatus(user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update teacher application (if pending)' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTeacherApplicationDto,
  ) {
    return this.teacherApplicationsService.update(user.sub, dto);
  }
}
