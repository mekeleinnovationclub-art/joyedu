import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  async getUserBookmarks(userId: string) {
    return this.prisma.bookmark.findMany({
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

  async addBookmark(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');

    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return existing;

    return this.prisma.bookmark.create({
      data: { userId, courseId },
      include: { course: true },
    });
  }

  async removeBookmark(userId: string, courseId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!bookmark) throw new NotFoundException('Bookmark not found');
    if (bookmark.userId !== userId) throw new ForbiddenException('Not your bookmark');

    return this.prisma.bookmark.delete({
      where: { userId_courseId: { userId, courseId } },
    });
  }
}
