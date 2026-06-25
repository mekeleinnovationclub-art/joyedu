import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CoursePermissionsService } from '../common/services/course-permissions.service';
import { CreateCourseDto, UpdateCourseDto, CourseFilterDto } from './dto/courses.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { generateSlug } from '../common/utils/slug.util';
import type { Prisma } from '@prisma/client';
import { CourseStructureService } from '../course-structure/course-structure.service';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private permissions: CoursePermissionsService,
    private courseStructure: CourseStructureService,
  ) {}

  async create(instructorId: string, userRoles: string[], dto: CreateCourseDto) {
    if (!this.permissions.isTeacher(userRoles) && !this.permissions.isAdmin(userRoles)) {
      throw new ForbiddenException('Only teachers and admins can create courses');
    }

    const slug = generateSlug(dto.title);
    const { categoryId, price, ...rest } = dto;

    return this.prisma.course.create({
      data: {
        ...rest,
        slug,
        price: price ?? 0,
        instructorId,
        categoryId: categoryId ?? null,
      },
      include: {
        category: true,
        instructor: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });
  }

  async findAll(filters: CourseFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      status: 'PUBLISHED',
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { hasSome: [filters.search] } },
      ];
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.difficulty) where.difficulty = filters.difficulty as Prisma.EnumDifficultyLevelFilter;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) (where.price as Prisma.DecimalFilter).gte = filters.minPrice;
      if (filters.maxPrice !== undefined) (where.price as Prisma.DecimalFilter).lte = filters.maxPrice;
    }

    const orderBy: Prisma.CourseOrderByWithRelationInput = {};
    if (filters.sortBy === 'price') orderBy.price = filters.sortOrder || 'asc';
    else if (filters.sortBy === 'title') orderBy.title = filters.sortOrder || 'asc';
    else orderBy.createdAt = filters.sortOrder || 'desc';

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          instructor: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          _count: { select: { enrollments: true, reviews: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return new PaginatedResult(courses, total, page, limit);
  }

  async findBySlug(slug: string, userId?: string, userRoles?: string[]) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        instructor: {
          select: { id: true, firstName: true, lastName: true, avatar: true, bio: true },
        },
        topics: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            subtopics: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
              include: {
                lessons: {
                  where: { deletedAt: null },
                  orderBy: { sortOrder: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    type: true,
                    videoDuration: true,
                    isFree: true,
                    sortOrder: true,
                  },
                },
              },
            },
          },
        },
        _count: { select: { enrollments: true, reviews: true } },
      },
    });

    if (!course || course.deletedAt) throw new NotFoundException('Course not found');

    const isOwner = userId && course.instructorId === userId;
    const isAdmin = userRoles?.includes('ADMIN');
    if (course.status !== 'PUBLISHED' && !isOwner && !isAdmin) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findById(id: string, userId: string, userRoles: string[]) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        topics: {
          where: { deletedAt: null },
          include: {
            subtopics: {
              where: { deletedAt: null },
              include: {
                lessons: {
                  where: { deletedAt: null },
                  include: {
                    contentBlocks: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');

    this.permissions.assert(userId, userRoles, course, 'read');
    return course;
  }

  async update(id: string, userId: string, userRoles: string[], dto: UpdateCourseDto) {
    const course = await this.permissions.getCourseOrThrow(id);
    this.permissions.assert(userId, userRoles, course, 'edit_content');

    const { categoryId, status, ...rest } = dto;
    const data: Prisma.CourseUpdateInput = { ...rest };

    if (categoryId !== undefined) {
      data.category = categoryId ? { connect: { id: categoryId } } : { disconnect: true };
    }

    if (status) {
      if (status === 'PUBLISHED') {
        return this.publish(id, userId, userRoles);
      }
      if (status === 'UNPUBLISHED' || status === 'DRAFT') {
        return this.unpublish(id, userId, userRoles);
      }
      if (status === 'REVIEW') {
        return this.submitForReview(id, userId, userRoles);
      }
      data.status = status;
    }

    return this.prisma.course.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async submitForReview(id: string, userId: string, userRoles: string[]) {
    const course = await this.permissions.getCourseOrThrow(id);
    this.permissions.assert(userId, userRoles, course, 'publish');

    return this.prisma.course.update({
      where: { id },
      data: { status: 'REVIEW' },
    });
  }

  async publish(id: string, userId: string, userRoles?: string[]) {
    const course = await this.permissions.getCourseOrThrow(id);
    const roles = userRoles || [];
    this.permissions.assert(userId, roles, course, 'publish');

    const topicCount = await this.prisma.topic.count({
      where: { courseId: id, deletedAt: null },
    });
    if (topicCount === 0) {
      throw new BadRequestException('Course must have at least one topic before publishing');
    }

    return this.prisma.course.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  async unpublish(id: string, userId: string, userRoles: string[]) {
    const course = await this.permissions.getCourseOrThrow(id);
    this.permissions.assert(userId, userRoles, course, 'unpublish');

    return this.prisma.course.update({
      where: { id },
      data: { status: 'UNPUBLISHED' },
    });
  }

  async archive(id: string, userId: string, userRoles: string[]) {
    const course = await this.permissions.getCourseOrThrow(id);
    this.permissions.assert(userId, userRoles, course, 'unpublish');

    return this.prisma.course.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async delete(id: string, userId: string, userRoles: string[]) {
    const course = await this.permissions.getCourseOrThrow(id);
    this.permissions.assert(userId, userRoles, course, 'delete');

    const fullCourse = await this.prisma.course.findUnique({
      where: { id },
      include: { topics: { include: { subtopics: { include: { lessons: true } } } } },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'COURSE_DELETED',
        entity: 'Course',
        entityId: id,
        metadata: fullCourse as Prisma.InputJsonValue,
      },
    });

    return this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getInstructorCourses(instructorId: string) {
    return this.prisma.course.findMany({
      where: { instructorId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        _count: { select: { enrollments: true, reviews: true } },
      },
    });
  }

  async getInstructorStudents(instructorId: string) {
    const courses = await this.prisma.course.findMany({
      where: { instructorId, deletedAt: null },
      select: { id: true },
    });

    const courseIds = courses.map((c) => c.id);

    return this.prisma.enrollment.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        course: {
          select: { id: true, title: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFeaturedCourses() {
    return this.prisma.course.findMany({
      where: { isFeatured: true, status: 'PUBLISHED', deletedAt: null },
      take: 8,
      include: {
        category: true,
        instructor: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        _count: { select: { enrollments: true, reviews: true } },
      },
    });
  }

  async getTeacherDashboard(instructorId: string) {
    const courses = await this.prisma.course.findMany({
      where: { instructorId, deletedAt: null },
      include: { _count: { select: { enrollments: true, reviews: true } } },
    });

    const courseIds = courses.map((c) => c.id);
    const [enrollments, revenue, reviews, coursePerformance] = await Promise.all([
      this.prisma.enrollment.count({ where: { courseId: { in: courseIds } } }),
      this.prisma.transaction.aggregate({
        where: { courseId: { in: courseIds }, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.review.findMany({
        where: { courseId: { in: courseIds }, deletedAt: null },
        include: { user: { select: { firstName: true, lastName: true } }, course: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.enrollment.findMany({
        where: { courseId: { in: courseIds } },
        include: { course: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const averageRating = courses.length > 0
      ? courses.reduce((sum, c) => sum + (c._count.reviews > 0 ? 4.5 : 0), 0) / courses.length
      : 0;

    return {
      totalCourses: courses.length,
      publishedCourses: courses.filter((c) => c.status === 'PUBLISHED').length,
      draftCourses: courses.filter((c) => c.status === 'DRAFT').length,
      reviewCourses: courses.filter((c) => c.status === 'REVIEW').length,
      totalStudents: enrollments,
      totalRevenue: Number(revenue._sum.amount || 0),
      totalTransactions: revenue._count,
      averageRating,
      courses,
      recentReviews: reviews,
      coursePerformance,
    };
  }

  async getStudentDashboard(userId: string) {
    const [enrollments, certificates, bookmarks, wishlist, progressStats] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { userId },
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
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.certificate.findMany({ where: { userId } }),
      this.prisma.bookmark.findMany({
        where: { userId },
        include: { course: { select: { id: true, title: true, slug: true, thumbnail: true } } },
      }),
      this.prisma.wishlist.findMany({
        where: { userId },
        include: { course: { select: { id: true, title: true, slug: true, thumbnail: true, price: true } } },
      }),
      this.prisma.enrollment.aggregate({
        where: { userId },
        _avg: { progress: true },
        _count: true,
      }),
    ]);

    const completedCourses = enrollments.filter((e) => e.completedAt).length;
    const inProgressCourses = enrollments.filter((e) => e.progress < 100 && !e.completedAt).length;

    return {
      enrolledCourses: enrollments,
      totalEnrollments: enrollments.length,
      completedCourses,
      inProgressCourses,
      averageProgress: progressStats._avg.progress || 0,
      certificates,
      totalCertificates: certificates.length,
      bookmarks,
      totalBookmarks: bookmarks.length,
      wishlist,
      totalWishlist: wishlist.length,
    };
  }

  async getCourseStructure(courseId: string, userId: string, userRoles: string[]) {
    return this.courseStructure.getCourseStructure(courseId, userId, userRoles);
  }
}
