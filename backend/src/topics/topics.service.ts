import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CoursePermissionsService } from '../common/services/course-permissions.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topics.dto';

@Injectable()
export class TopicsService {
  constructor(
    private prisma: PrismaService,
    private permissions: CoursePermissionsService,
  ) {}

  async findById(id: string, userId: string, userRoles: string[]) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        course: true,
        subtopics: {
          where: { deletedAt: null },
          include: { lessons: { where: { deletedAt: null } } },
          orderBy: { sortOrder: 'asc' }
        }
      },
    });
    if (!topic) throw new NotFoundException('Topic not found');
    this.permissions.assert(userId, userRoles, topic.course, 'edit_content');
    return topic;
  }

  async create(userId: string, userRoles: string[], dto: CreateTopicDto) {
    const course = await this.permissions.getCourseOrThrow(dto.courseId);
    this.permissions.assert(userId, userRoles, course, 'edit_content');

    const count = await this.prisma.topic.count({ where: { courseId: dto.courseId } });
    return this.prisma.topic.create({
      data: {
        title: dto.title,
        description: dto.description,
        courseId: dto.courseId,
        sortOrder: dto.sortOrder ?? count
      },
      include: { subtopics: true },
    });
  }

  async update(id: string, userId: string, userRoles: string[], dto: UpdateTopicDto) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: { course: true }
    });
    if (!topic) throw new NotFoundException('Topic not found');
    this.permissions.assert(userId, userRoles, topic.course, 'edit_content');

    return this.prisma.topic.update({
      where: { id },
      data: dto,
      include: { subtopics: { where: { deletedAt: null } } }
    });
  }

  async delete(id: string, userId: string, userRoles: string[]) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: { course: true }
    });
    if (!topic) throw new NotFoundException('Topic not found');
    this.permissions.assert(userId, userRoles, topic.course, 'edit_content');

    await this.prisma.topic.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Topic deleted' };
  }

  async reorder(courseId: string, userId: string, userRoles: string[], topicIds: string[]) {
    const course = await this.permissions.getCourseOrThrow(courseId);
    this.permissions.assert(userId, userRoles, course, 'edit_content');

    await Promise.all(
      topicIds.map((id, index) =>
        this.prisma.topic.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    return { message: 'Topics reordered' };
  }
}
