import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getUserWishlist(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            category: true,
            instructor: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            _count: { select: { enrollments: true, reviews: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToWishlist(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');

    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return existing;

    return this.prisma.wishlist.create({
      data: { userId, courseId },
      include: { course: true },
    });
  }

  async removeFromWishlist(userId: string, courseId: string) {
    const item = await this.prisma.wishlist.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!item) throw new NotFoundException('Wishlist item not found');
    if (item.userId !== userId) throw new ForbiddenException('Not your wishlist item');

    return this.prisma.wishlist.delete({
      where: { userId_courseId: { userId, courseId } },
    });
  }
}
