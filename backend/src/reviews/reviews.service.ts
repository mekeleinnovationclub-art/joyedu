import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateReviewDto } from './dto/reviews.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: dto.courseId } },
    });
    if (!enrollment) throw new NotFoundException('Must be enrolled to review');

    const existing = await this.prisma.review.findUnique({
      where: { userId_courseId: { userId, courseId: dto.courseId } },
    });
    if (existing) throw new ConflictException('Already reviewed');

    return this.prisma.review.create({
      data: { userId, courseId: dto.courseId, rating: dto.rating, comment: dto.comment },
      include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
    });
  }

  async getCourseReviews(courseId: string, query: PaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { courseId, isVisible: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
      }),
      this.prisma.review.count({ where: { courseId, isVisible: true } }),
    ]);

    return new PaginatedResult(reviews, total, page, limit);
  }

  async getCourseRatingStats(courseId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { courseId, isVisible: true },
      select: { rating: true },
    });
    const total = reviews.length;
    const average = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      stars: star,
      count: reviews.filter((r) => r.rating === star).length,
    }));
    return { average: Math.round(average * 10) / 10, total, distribution };
  }
}
