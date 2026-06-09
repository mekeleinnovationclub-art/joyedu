import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateChapterDto, UpdateChapterDto } from './dto/chapters.dto';

@Injectable()
export class ChaptersService {
  constructor(private prisma: PrismaService) {}

  async create(instructorId: string, dto: CreateChapterDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not your course');

    const count = await this.prisma.chapter.count({ where: { courseId: dto.courseId } });
    return this.prisma.chapter.create({
      data: { title: dto.title, courseId: dto.courseId, sortOrder: dto.sortOrder ?? count },
      include: { lessons: true },
    });
  }

  async update(id: string, instructorId: string, dto: UpdateChapterDto) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id }, include: { course: true } });
    if (!chapter) throw new NotFoundException('Chapter not found');
    if (chapter.course.instructorId !== instructorId) throw new ForbiddenException('Not your course');

    return this.prisma.chapter.update({ where: { id }, data: dto, include: { lessons: true } });
  }

  async delete(id: string, instructorId: string) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id }, include: { course: true } });
    if (!chapter) throw new NotFoundException('Chapter not found');
    if (chapter.course.instructorId !== instructorId) throw new ForbiddenException('Not your course');

    await this.prisma.chapter.delete({ where: { id } });
    return { message: 'Chapter deleted' };
  }

  async reorder(courseId: string, instructorId: string, chapterIds: string[]) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not your course');

    await Promise.all(
      chapterIds.map((id, index) =>
        this.prisma.chapter.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    return { message: 'Chapters reordered' };
  }
}
