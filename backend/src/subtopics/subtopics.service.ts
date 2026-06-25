import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CoursePermissionsService } from '../common/services/course-permissions.service';
import { CreateSubtopicDto, UpdateSubtopicDto } from './dto/subtopics.dto';

@Injectable()
export class SubtopicsService {
  constructor(
    private prisma: PrismaService,
    private permissions: CoursePermissionsService,
  ) {}

  async findById(id: string, userId: string, userRoles: string[]) {
    const subtopic = await this.prisma.subtopic.findUnique({
      where: { id },
      include: {
        topic: { include: { course: true } },
        lessons: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!subtopic) throw new NotFoundException('Subtopic not found');
    this.permissions.assert(userId, userRoles, subtopic.topic.course, 'edit_content');
    return subtopic;
  }

  async create(userId: string, userRoles: string[], dto: CreateSubtopicDto) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: dto.topicId },
      include: { course: true },
    });
    if (!topic || topic.deletedAt) throw new NotFoundException('Topic not found');
    this.permissions.assert(userId, userRoles, topic.course, 'edit_content');

    const count = await this.prisma.subtopic.count({ where: { topicId: dto.topicId } });
    return this.prisma.subtopic.create({
      data: {
        title: dto.title,
        description: dto.description,
        topicId: dto.topicId,
        summary: dto.summary,
        keyTakeaways: dto.keyTakeaways ?? [],
        nextSubtopicId: dto.nextSubtopicId,
        sortOrder: dto.sortOrder ?? count,
      },
      include: { lessons: true },
    });
  }

  async update(id: string, userId: string, userRoles: string[], dto: UpdateSubtopicDto) {
    const subtopic = await this.prisma.subtopic.findUnique({
      where: { id },
      include: { topic: { include: { course: true } } },
    });
    if (!subtopic) throw new NotFoundException('Subtopic not found');
    this.permissions.assert(userId, userRoles, subtopic.topic.course, 'edit_content');

    return this.prisma.subtopic.update({
      where: { id },
      data: dto,
      include: { lessons: { where: { deletedAt: null } } },
    });
  }

  async delete(id: string, userId: string, userRoles: string[]) {
    const subtopic = await this.prisma.subtopic.findUnique({
      where: { id },
      include: { topic: { include: { course: true } } },
    });
    if (!subtopic) throw new NotFoundException('Subtopic not found');
    this.permissions.assert(userId, userRoles, subtopic.topic.course, 'edit_content');

    await this.prisma.subtopic.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Subtopic deleted' };
  }

  async reorder(topicId: string, userId: string, userRoles: string[], subtopicIds: string[]) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: { course: true },
    });
    if (!topic) throw new NotFoundException('Topic not found');
    this.permissions.assert(userId, userRoles, topic.course, 'edit_content');

    await Promise.all(
      subtopicIds.map((id, index) =>
        this.prisma.subtopic.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    return { message: 'Subtopics reordered' };
  }
}
