import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CoursePermissionsService } from '../common/services/course-permissions.service';
import {
  CreateCoursePrerequisiteDto,
  BulkCoursePrerequisitesDto,
  RemoveCoursePrerequisiteDto,
} from './dto/course-prerequisites.dto';

@Injectable()
export class CoursePrerequisitesService {
  constructor(
    private prisma: PrismaService,
    private permissions: CoursePermissionsService,
  ) {}

  private async assertCourseAccess(courseId: string, userId: string, userRoles: string[]) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');
    this.permissions.assert(userId, userRoles, course, 'edit_content');
    return course;
  }

  async create(userId: string, userRoles: string[], dto: CreateCoursePrerequisiteDto) {
    await this.assertCourseAccess(dto.courseId, userId, userRoles);

    const prerequisite = await this.prisma.course.findUnique({
      where: { id: dto.prerequisiteId, status: 'PUBLISHED', deletedAt: null },
    });
    if (!prerequisite) throw new NotFoundException('Prerequisite course not found or not published');

    return this.prisma.coursePrerequisite.create({
      data: {
        courseId: dto.courseId,
        prerequisiteId: dto.prerequisiteId,
      },
      include: {
        prerequisite: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
          },
        },
      },
    });
  }

  async bulkCreate(userId: string, userRoles: string[], dto: BulkCoursePrerequisitesDto) {
    await this.assertCourseAccess(dto.courseId, userId, userRoles);

    const prerequisites = await this.prisma.course.findMany({
      where: {
        id: { in: dto.prerequisiteIds },
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: { id: true },
    });

    if (prerequisites.length !== dto.prerequisiteIds.length) {
      throw new NotFoundException('One or more prerequisite courses not found or not published');
    }

    const data = dto.prerequisiteIds.map((prerequisiteId) => ({
      courseId: dto.courseId,
      prerequisiteId,
    }));

    await this.prisma.coursePrerequisite.createMany({
      data,
      skipDuplicates: true,
    });

    return this.prisma.coursePrerequisite.findMany({
      where: { courseId: dto.courseId },
      include: {
        prerequisite: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
          },
        },
      },
    });
  }

  async remove(userId: string, userRoles: string[], dto: RemoveCoursePrerequisiteDto) {
    await this.assertCourseAccess(dto.courseId, userId, userRoles);

    return this.prisma.coursePrerequisite.deleteMany({
      where: {
        courseId: dto.courseId,
        prerequisiteId: dto.prerequisiteId,
      },
    });
  }

  async getByCourse(courseId: string) {
    return this.prisma.coursePrerequisite.findMany({
      where: { courseId },
      include: {
        prerequisite: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            difficulty: true,
          },
        },
      },
    });
  }

  async getPrerequisiteCourses(courseId: string) {
    const existing = await this.prisma.coursePrerequisite.findMany({
      where: { courseId },
      select: { prerequisiteId: true },
    });

    const existingIds = existing.map((p) => p.prerequisiteId);

    return this.prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        id: { notIn: existingIds.length > 0 ? existingIds : undefined },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        difficulty: true,
      },
    });
  }
}
