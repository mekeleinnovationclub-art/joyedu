import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CoursePermissionsService } from '../common/services/course-permissions.service';
import {
  CreateCourseMediaDto,
  UpdateCourseMediaDto,
  ReorderCourseMediaDto,
} from './dto/course-media.dto';

@Injectable()
export class CourseMediaService {
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

  async create(userId: string, userRoles: string[], dto: CreateCourseMediaDto) {
    await this.assertCourseAccess(dto.courseId, userId, userRoles);

    const count = await this.prisma.courseMedia.count({
      where: { courseId: dto.courseId, deletedAt: null },
    });

    return this.prisma.courseMedia.create({
      data: {
        courseId: dto.courseId,
        type: dto.type,
        url: dto.url,
        altText: dto.altText,
        sortOrder: dto.sortOrder ?? count,
      },
    });
  }

  async findById(id: string) {
    const media = await this.prisma.courseMedia.findUnique({
      where: { id },
    });
    if (!media || media.deletedAt) throw new NotFoundException('Course media not found');
    return media;
  }

  async update(id: string, userId: string, userRoles: string[], dto: UpdateCourseMediaDto) {
    const media = await this.prisma.courseMedia.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!media || media.deletedAt) throw new NotFoundException('Course media not found');

    this.permissions.assert(userId, userRoles, media.course, 'edit_content');

    return this.prisma.courseMedia.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string, userRoles: string[]) {
    const media = await this.prisma.courseMedia.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!media || media.deletedAt) throw new NotFoundException('Course media not found');

    this.permissions.assert(userId, userRoles, media.course, 'edit_content');

    return this.prisma.courseMedia.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getByCourse(courseId: string) {
    return this.prisma.courseMedia.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async reorder(userId: string, userRoles: string[], dto: ReorderCourseMediaDto) {
    await this.assertCourseAccess(dto.courseId, userId, userRoles);

    await Promise.all(
      dto.mediaIds.map((id, index) =>
        this.prisma.courseMedia.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.getByCourse(dto.courseId);
  }
}
