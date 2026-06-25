import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CoursePermissionsService } from '../common/services/course-permissions.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcements.dto';

@Injectable()
export class AnnouncementsService {
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

  async create(userId: string, userRoles: string[], dto: CreateAnnouncementDto) {
    await this.assertCourseAccess(dto.courseId, userId, userRoles);

    return this.prisma.announcement.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        content: dto.content,
      },
    });
  }

  async findById(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async update(id: string, userId: string, userRoles: string[], dto: UpdateAnnouncementDto) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');

    this.permissions.assert(userId, userRoles, announcement.course, 'edit_content');

    return this.prisma.announcement.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string, userRoles: string[]) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');

    this.permissions.assert(userId, userRoles, announcement.course, 'edit_content');

    return this.prisma.announcement.delete({
      where: { id },
    });
  }

  async getByCourse(courseId: string) {
    return this.prisma.announcement.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
