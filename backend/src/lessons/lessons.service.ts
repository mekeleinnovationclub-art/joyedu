import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CoursePermissionsService } from '../common/services/course-permissions.service';
import { CreateLessonDto, UpdateLessonDto } from './dto/lessons.dto';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class LessonsService {
  constructor(
    private prisma: PrismaService,
    private permissions: CoursePermissionsService,
  ) {}

  async create(userId: string, userRoles: string[], dto: CreateLessonDto) {
    const subtopic = await this.prisma.subtopic.findUnique({
      where: { id: dto.subtopicId },
      include: { topic: { include: { course: true } } },
    });
    if (!subtopic || subtopic.deletedAt) throw new NotFoundException('Subtopic not found');
    this.permissions.assert(userId, userRoles, subtopic.topic.course, 'edit_content');

    const slug = generateSlug(dto.title);
    const count = await this.prisma.lesson.count({ where: { subtopicId: dto.subtopicId } });

    return this.prisma.lesson.create({
      data: {
        title: dto.title,
        slug,
        type: dto.type,
        content: dto.content,
        videoUrl: dto.videoUrl,
        videoDuration: dto.videoDuration,
        isFree: dto.isFree ?? false,
        sortOrder: dto.sortOrder ?? count,
        subtopicId: dto.subtopicId,
      },
    });
  }

  async findById(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        subtopic: { include: { topic: { include: { course: true } } } },
        resources: true,
        quizzes: { include: { questions: true } },
        contentBlocks: true,
        exercises: true,
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  async findBySubtopic(subtopicId: string, userId: string, userRoles: string[]) {
    const subtopic = await this.prisma.subtopic.findUnique({
      where: { id: subtopicId },
      include: { topic: { include: { course: true } } },
    });
    if (!subtopic) throw new NotFoundException('Subtopic not found');
    this.permissions.assert(userId, userRoles, subtopic.topic.course, 'view_content');

    return this.prisma.lesson.findMany({
      where: { subtopicId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        contentBlocks: true,
        exercises: true,
        quizzes: { include: { questions: true } },
      },
    });
  }

  async update(id: string, userId: string, userRoles: string[], dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { subtopic: { include: { topic: { include: { course: true } } } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    this.permissions.assert(userId, userRoles, lesson.subtopic.topic.course, 'edit_content');

    return this.prisma.lesson.update({ where: { id }, data: dto });
  }

  async delete(id: string, userId: string, userRoles: string[]) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { subtopic: { include: { topic: { include: { course: true } } } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    this.permissions.assert(userId, userRoles, lesson.subtopic.topic.course, 'edit_content');

    await this.prisma.lesson.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Lesson deleted' };
  }

  async reorder(subtopicId: string, userId: string, userRoles: string[], lessonIds: string[]) {
    const subtopic = await this.prisma.subtopic.findUnique({
      where: { id: subtopicId },
      include: { topic: { include: { course: true } } },
    });
    if (!subtopic) throw new NotFoundException('Subtopic not found');
    this.permissions.assert(userId, userRoles, subtopic.topic.course, 'edit_content');

    await Promise.all(
      lessonIds.map((id, index) =>
        this.prisma.lesson.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    return { message: 'Lessons reordered' };
  }

  async duplicate(id: string, userId: string, userRoles: string[]) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { subtopic: { include: { topic: { include: { course: true } } } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    this.permissions.assert(userId, userRoles, lesson.subtopic.topic.course, 'edit_content');

    const count = await this.prisma.lesson.count({ where: { subtopicId: lesson.subtopicId } });
    const newSlug = `${lesson.slug}-copy-${count + 1}`;

    const newLesson = await this.prisma.lesson.create({
      data: {
        title: `${lesson.title} (Copy)`,
        slug: newSlug,
        type: lesson.type,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        videoDuration: lesson.videoDuration,
        isFree: lesson.isFree,
        status: lesson.status,
        summary: lesson.summary,
        keyTakeaways: lesson.keyTakeaways,
        subtopicId: lesson.subtopicId,
        sortOrder: count,
      },
    });

    // Duplicate content blocks
    const contentBlocks = await this.prisma.contentBlock.findMany({
      where: { lessonId: id, deletedAt: null },
    });
    await Promise.all(
      contentBlocks.map((block) =>
        this.prisma.contentBlock.create({
          data: {
            type: block.type,
            title: block.title,
            content: block.content as any,
            sortOrder: block.sortOrder,
            lessonId: newLesson.id,
          },
        }),
      ),
    );

    return newLesson;
  }
}
