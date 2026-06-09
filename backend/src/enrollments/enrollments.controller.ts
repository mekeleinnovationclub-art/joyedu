import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { EnrollDto, UpdateProgressDto } from './dto/enrollments.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Enrollments')
@Controller('enrollments')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Enroll in a course' })
  async enroll(@CurrentUser() user: JwtPayload, @Body() dto: EnrollDto) {
    return this.enrollmentsService.enroll(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my enrollments' })
  async getMyEnrollments(@CurrentUser() user: JwtPayload) {
    return this.enrollmentsService.getMyEnrollments(user.sub);
  }

  @Put('progress')
  @ApiOperation({ summary: 'Update lesson progress' })
  async updateProgress(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProgressDto) {
    return this.enrollmentsService.updateProgress(user.sub, dto);
  }

  @Get(':courseId/progress')
  @ApiOperation({ summary: 'Get course progress' })
  async getCourseProgress(@CurrentUser() user: JwtPayload, @Param('courseId') courseId: string) {
    return this.enrollmentsService.getCourseProgress(user.sub, courseId);
  }
}
