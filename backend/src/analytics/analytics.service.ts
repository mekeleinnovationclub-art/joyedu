import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getInstructorAnalytics(instructorId: string) {
    const courses = await this.prisma.course.findMany({
      where: { instructorId, deletedAt: null },
      select: { id: true },
    });

    const courseIds = courses.map((c) => c.id);

    const [totalStudents, totalRevenue, totalEnrollments, recentEnrollments] = await Promise.all([
      this.prisma.enrollment.count({
        where: { courseId: { in: courseIds } },
      }),
      this.prisma.transaction.aggregate({
        where: {
          courseId: { in: courseIds },
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      this.prisma.enrollment.count({
        where: { courseId: { in: courseIds } },
      }),
      this.prisma.enrollment.findMany({
        where: { courseId: { in: courseIds } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
    ]);

    const courseStats = await Promise.all(
      courses.map(async (course) => {
        const [enrollmentCount, revenue] = await Promise.all([
          this.prisma.enrollment.count({
            where: { courseId: course.id },
          }),
          this.prisma.transaction.aggregate({
            where: {
              courseId: course.id,
              status: 'COMPLETED',
            },
            _sum: { amount: true },
          }),
        ]);

        return {
          courseId: course.id,
          enrollments: enrollmentCount,
          revenue: Number(revenue._sum?.amount || 0),
        };
      }),
    );

    return {
      overview: {
        totalStudents,
        totalRevenue: Number(totalRevenue._sum?.amount || 0),
        totalEnrollments,
        totalCourses: courses.length,
      },
      courseStats,
      recentEnrollments,
    };
  }
}
