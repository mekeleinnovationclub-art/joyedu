import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateLessonDto, UpdateLessonDto } from './dto/lessons.dto';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async create(instructorId: string, dto: CreateLessonDto) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: dto.chapterId },
      include: { course: true },
    });
    if (!chapter) throw new NotFoundException('Chapter not found');
    if (chapter.course.instructorId !== instructorId) throw new ForbiddenException('Not your course');

    const slug = generateSlug(dto.title);
    const count = await this.prisma.lesson.count({ where: { chapterId: dto.chapterId } });

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
        chapterId: dto.chapterId,
      },
    });
  }

  async findById(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { resources: true, quizzes: { include: { questions: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  async update(id: string, instructorId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { chapter: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.chapter.course.instructorId !== instructorId) throw new ForbiddenException('Not your course');

    return this.prisma.lesson.update({ where: { id }, data: dto });
  }

  async delete(id: string, instructorId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { chapter: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.chapter.course.instructorId !== instructorId) throw new ForbiddenException('Not your course');

    await this.prisma.lesson.delete({ where: { id } });
    return { message: 'Lesson deleted' };
  }
}
