import { ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { Course } from '@prisma/client';

export type CoursePermissionAction =
  | 'read'
  | 'edit_content'
  | 'publish'
  | 'unpublish'
  | 'delete'
  | 'moderate'
  | 'feature';

@Injectable()
export class CoursePermissionsService {
  private readonly logger = new Logger(CoursePermissionsService.name);

  constructor(private prisma: PrismaService) {}

  async getCourseOrThrow(courseId: string): Promise<Course> {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.deletedAt) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  isAdmin(userRoles: string[]): boolean {
    return userRoles.includes('ADMIN');
  }

  isTeacher(userRoles: string[]): boolean {
    return userRoles.includes('TEACHER');
  }

  isOwner(course: Course, userId: string): boolean {
    return course.instructorId === userId;
  }

  can(userId: string, userRoles: string[], course: Course, action: CoursePermissionAction): boolean {
    const admin = this.isAdmin(userRoles);
    const owner = this.isOwner(course, userId);
    const teacher = this.isTeacher(userRoles);

    switch (action) {
      case 'read':
        return admin || owner || course.status === 'PUBLISHED';
      case 'edit_content':
        return (owner && teacher) || admin;
      case 'publish':
      case 'unpublish':
        return (owner && teacher) || admin;
      case 'delete':
        return admin || (owner && teacher);
      case 'moderate':
        return admin;
      case 'feature':
        return admin;
      default:
        return false;
    }
  }

  assert(userId: string, userRoles: string[], course: Course, action: CoursePermissionAction) {
    const admin = this.isAdmin(userRoles);
    const owner = this.isOwner(course, userId);
    const teacher = this.isTeacher(userRoles);

    this.logger.log(`Permission check - Action: ${action}, UserID: ${userId}, CourseID: ${course.id}, CourseOwner: ${course.instructorId}, UserRoles: ${userRoles.join(', ')}, IsAdmin: ${admin}, IsOwner: ${owner}, IsTeacher: ${teacher}`);

    if (!this.can(userId, userRoles, course, action)) {
      this.logger.error(`Permission denied - Action: ${action}, UserID: ${userId}, CourseID: ${course.id}, CourseOwner: ${course.instructorId}, UserRoles: ${userRoles.join(', ')}, IsAdmin: ${admin}, IsOwner: ${owner}, IsTeacher: ${teacher}`);
      throw new ForbiddenException(`You do not have permission to ${action.replace('_', ' ')} this course`);
    }
  }

  /** Admin may only moderate teacher-owned courses — not edit educational content */
  filterAdminModerationDto<T extends Record<string, unknown>>(
    course: Course,
    adminId: string,
    dto: T,
  ): T {
    if (course.instructorId === adminId) {
      return dto;
    }
    const allowed = { ...dto };
    delete allowed.title;
    delete allowed.description;
    delete allowed.price;
    delete allowed.subtitle;
    delete allowed.shortDescription;
    delete allowed.thumbnail;
    delete allowed.coverImage;
    delete allowed.previewVideo;
    delete allowed.promotionalVideo;
    delete allowed.requirements;
    delete allowed.learningGoals;
    delete allowed.tags;
    delete allowed.difficulty;
    delete allowed.language;
    delete allowed.duration;
    delete allowed.categoryId;
    return allowed;
  }
}
