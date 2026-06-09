import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/reviews.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.sub, dto);
  }

  @Public()
  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get course reviews' })
  async getCourseReviews(@Param('courseId') courseId: string, @Query() query: PaginationDto) {
    return this.reviewsService.getCourseReviews(courseId, query);
  }

  @Public()
  @Get('course/:courseId/stats')
  @ApiOperation({ summary: 'Get course rating statistics' })
  async getCourseRatingStats(@Param('courseId') courseId: string) {
    return this.reviewsService.getCourseRatingStats(courseId);
  }
}
