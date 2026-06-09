import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCourseDto, UpdateCourseDto, CourseFilterDto } from './dto/courses.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { generateSlug } from '../common/utils/slug.util';
import type { Prisma } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(instructorId: string, dto: CreateCourseDto) {
    const slug = generateSlug(dto.title);
    return this.prisma.course.create({
      data: {
        ...dto,
        slug,
        price: dto.price || 0,
        instructorId,
      },
      include: { category: true, instructor: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
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

  async findBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        instructor: {
          select: { id: true, firstName: true, lastName: true, avatar: true, bio: true },
        },
        chapters: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
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
        _count: { select: { enrollments: true, reviews: true } },
      },
    });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');
    return course;
  }

  async findById(id: string, userId: string, userRoles: string[]) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { category: true, chapters: { include: { lessons: true } } },
    });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');
    
    // Check if user is the course instructor or an admin
    const isInstructor = course.instructorId === userId;
    const isAdmin = userRoles.includes('ADMIN');
    
    if (!isInstructor && !isAdmin) {
      throw new ForbiddenException('You do not have access to this course');
    }
    
    return course;
  }

  async update(id: string, instructorId: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not your course');

    const { categoryId, ...rest } = dto;
    const data: Prisma.CourseUpdateInput = { ...rest };
    if (categoryId !== undefined) {
      data.category = categoryId ? { connect: { id: categoryId } } : { disconnect: true };
    }

    return this.prisma.course.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async publish(id: string, instructorId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { chapters: { include: { lessons: true } } },
    });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not your course');

    return this.prisma.course.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  async archive(id: string, instructorId: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not your course');

    return this.prisma.course.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async delete(id: string, instructorId: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not your course');

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

    const enrollments = await this.prisma.enrollment.findMany({
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
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return enrollments;
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
}
