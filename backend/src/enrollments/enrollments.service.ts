import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EnrollDto, UpdateProgressDto } from './dto/enrollments.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enroll(userId: string, dto: EnrollDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');

    if (course.status !== 'PUBLISHED') {
      throw new BadRequestException('Course is not available for enrollment');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: dto.courseId } },
    });
    if (existing) throw new ConflictException('Already enrolled');

    const price = Number(course.discountPrice ?? course.price);

    if (price > 0) {
      const completedPayment = await this.prisma.transaction.findFirst({
        where: {
          userId,
          courseId: dto.courseId,
          status: 'COMPLETED',
        },
      });
      if (!completedPayment) {
        throw new ForbiddenException('Payment required before enrollment. Please purchase the course first.');
      }

      return this.prisma.enrollment.create({
        data: {
          userId,
          courseId: dto.courseId,
          transactionId: completedPayment.id,
        },
        include: { course: { select: { id: true, title: true, slug: true, thumbnail: true } } },
      });
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        courseId: dto.courseId,
        amount: 0,
        status: 'COMPLETED',
        paymentMethod: 'STRIPE',
        description: 'Free enrollment',
      },
    });

    return this.prisma.enrollment.create({
      data: {
        userId,
        courseId: dto.courseId,
        transactionId: transaction.id,
      },
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
        transaction: {
          select: { id: true, amount: true, status: true, createdAt: true },
        },
      },
    });
  }

  async checkEnrollment(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    return { enrolled: !!enrollment, enrollment };
  }

  async updateProgress(userId: string, dto: UpdateProgressDto) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        course: {
          topics: {
            some: {
              subtopics: {
                some: {
                  lessons: {
                    some: { id: dto.lessonId }
                  }
                }
              }
            }
          }
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
      where: { 
        subtopic: {
          topic: {
            course: {
              enrollments: { some: { id: enrollment.id } }
            }
          }
        },
        deletedAt: null 
      },
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
        topicProgress: true,
        subtopicProgress: true,
        course: {
          include: {
            topics: {
              where: { deletedAt: null },
              include: {
                subtopics: {
                  where: { deletedAt: null },
                  include: {
                    lessons: {
                      where: { deletedAt: null },
                      select: { id: true }
                    }
                  }
                }
              }
            }
          },
        },
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async updateTopicProgress(userId: string, dto: { topicId: string; completed: boolean; progress: number }) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        course: {
          topics: { some: { id: dto.topicId } },
        },
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    await this.prisma.topicProgress.upsert({
      where: { enrollmentId_topicId: { enrollmentId: enrollment.id, topicId: dto.topicId } },
      update: {
        completed: dto.completed,
        progress: dto.progress,
        completedAt: dto.completed ? new Date() : null,
      },
      create: {
        enrollmentId: enrollment.id,
        topicId: dto.topicId,
        completed: dto.completed,
        progress: dto.progress,
        completedAt: dto.completed ? new Date() : null,
      },
    });

    return { message: 'Topic progress updated' };
  }

  async updateSubtopicProgress(userId: string, dto: { subtopicId: string; completed: boolean; progress: number }) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        course: {
          topics: {
            some: {
              subtopics: { some: { id: dto.subtopicId } },
            },
          },
        },
      },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    await this.prisma.subtopicProgress.upsert({
      where: { enrollmentId_subtopicId: { enrollmentId: enrollment.id, subtopicId: dto.subtopicId } },
      update: {
        completed: dto.completed,
        progress: dto.progress,
        completedAt: dto.completed ? new Date() : null,
      },
      create: {
        enrollmentId: enrollment.id,
        subtopicId: dto.subtopicId,
        completed: dto.completed,
        progress: dto.progress,
        completedAt: dto.completed ? new Date() : null,
      },
    });

    return { message: 'Subtopic progress updated' };
  }
}
