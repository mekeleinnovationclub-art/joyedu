import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CoursePermissionsService } from '../common/services/course-permissions.service';
import { CreateExerciseDto, UpdateExerciseDto } from './dto/exercises.dto';

@Injectable()
export class ExercisesService {
  constructor(
    private prisma: PrismaService,
    private permissions: CoursePermissionsService,
  ) {}

  private async assertLessonAccess(lessonId: string, userId: string, userRoles: string[]) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { subtopic: { include: { topic: { include: { course: true } } } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    this.permissions.assert(userId, userRoles, lesson.subtopic.topic.course, 'edit_content');
    return lesson;
  }

  async create(userId: string, userRoles: string[], dto: CreateExerciseDto) {
    await this.assertLessonAccess(dto.lessonId, userId, userRoles);
    return this.prisma.exercise.create({
      data: {
        title: dto.title,
        description: dto.description,
        hints: dto.hints || [],
        solution: dto.solution,
        fileUrl: dto.fileUrl,
        lessonId: dto.lessonId,
      },
    });
  }

  async findById(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });
    if (!exercise || exercise.deletedAt) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  async update(id: string, userId: string, userRoles: string[], dto: UpdateExerciseDto) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: { lesson: { include: { subtopic: { include: { topic: { include: { course: true } } } } } } },
    });
    if (!exercise || exercise.deletedAt) throw new NotFoundException('Exercise not found');
    this.permissions.assert(userId, userRoles, exercise.lesson.subtopic.topic.course, 'edit_content');

    return this.prisma.exercise.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string, userRoles: string[]) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: { lesson: { include: { subtopic: { include: { topic: { include: { course: true } } } } } } },
    });
    if (!exercise || exercise.deletedAt) throw new NotFoundException('Exercise not found');
    this.permissions.assert(userId, userRoles, exercise.lesson.subtopic.topic.course, 'edit_content');

    return this.prisma.exercise.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getByLesson(lessonId: string) {
    return this.prisma.exercise.findMany({
      where: { lessonId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async reorder(lessonId: string, userId: string, userRoles: string[], exerciseIds: string[]) {
    await this.assertLessonAccess(lessonId, userId, userRoles);
    await Promise.all(
      exerciseIds.map((id, index) =>
        this.prisma.exercise.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );
    return { message: 'Exercises reordered' };
  }
}
