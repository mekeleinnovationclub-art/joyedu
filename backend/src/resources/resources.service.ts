import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CoursePermissionsService } from '../common/services/course-permissions.service';
import { CreateResourceDto, UpdateResourceDto } from './dto/resources.dto';

@Injectable()
export class ResourcesService {
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

  private async assertLessonAccess(lessonId: string, userId: string, userRoles: string[]) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { subtopic: { include: { topic: { include: { course: true } } } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    this.permissions.assert(userId, userRoles, lesson.subtopic.topic.course, 'edit_content');
    return lesson;
  }

  async create(userId: string, userRoles: string[], dto: CreateResourceDto) {
    if (dto.lessonId) {
      await this.assertLessonAccess(dto.lessonId, userId, userRoles);
    } else if (dto.courseId) {
      await this.assertCourseAccess(dto.courseId, userId, userRoles);
    }

    return this.prisma.resource.create({
      data: {
        title: dto.title,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
        fileSize: dto.fileSize,
        lessonId: dto.lessonId,
        courseId: dto.courseId,
      },
    });
  }

  async findById(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });
    if (!resource) throw new NotFoundException('Resource not found');
    return resource;
  }

  async update(id: string, userId: string, userRoles: string[], dto: UpdateResourceDto) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        lesson: {
          include: { subtopic: { include: { topic: { include: { course: true } } } } },
        },
        course: true,
      },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    if (resource.lesson) {
      this.permissions.assert(userId, userRoles, resource.lesson.subtopic.topic.course, 'edit_content');
    } else if (resource.course) {
      this.permissions.assert(userId, userRoles, resource.course, 'edit_content');
    }

    return this.prisma.resource.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string, userRoles: string[]) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        lesson: {
          include: { subtopic: { include: { topic: { include: { course: true } } } } },
        },
        course: true,
      },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    if (resource.lesson) {
      this.permissions.assert(userId, userRoles, resource.lesson.subtopic.topic.course, 'edit_content');
    } else if (resource.course) {
      this.permissions.assert(userId, userRoles, resource.course, 'edit_content');
    }

    return this.prisma.resource.delete({
      where: { id },
    });
  }

  async getByLesson(lessonId: string) {
    return this.prisma.resource.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getByCourse(courseId: string) {
    return this.prisma.resource.findMany({
      where: { courseId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
