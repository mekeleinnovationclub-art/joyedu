import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EnrollDto, UpdateProgressDto } from './dto/enrollments.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enroll(userId: string, dto: EnrollDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: dto.courseId } },
    });
    if (existing) throw new ConflictException('Already enrolled');

    return this.prisma.enrollment.create({
      data: { userId, courseId: dto.courseId },
      include: { course: { select: { id: true, title: true, slug: true, thumbnail: true } } },
    });
  }

  async getMyEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            instructor: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async updateProgress(userId: string, dto: UpdateProgressDto) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        course: {
          chapters: { some: { lessons: { some: { id: dto.lessonId } } } },
        },
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const progress = await this.prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: dto.lessonId } },
      update: {
        completed: dto.completed ?? false,
        watchTime: dto.watchTime ?? 0,
        completedAt: dto.completed ? new Date() : null,
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId: dto.lessonId,
        completed: dto.completed ?? false,
        watchTime: dto.watchTime ?? 0,
        completedAt: dto.completed ? new Date() : null,
      },
    });

    const totalLessons = await this.prisma.lesson.count({
      where: { chapter: { course: { enrollments: { some: { id: enrollment.id } } } } },
    });
    const completedLessons = await this.prisma.lessonProgress.count({
      where: { enrollmentId: enrollment.id, completed: true },
    });

    const courseProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: courseProgress,
        completedAt: courseProgress >= 100 ? new Date() : null,
      },
    });

    return { progress, courseProgress };
  }

  async getCourseProgress(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        lessonProgress: true,
        course: {
          include: {
            chapters: { include: { lessons: { select: { id: true } } } },
          },
        },
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }
}
