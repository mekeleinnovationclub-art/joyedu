import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CoursePermissionsService } from '../common/services/course-permissions.service';
import { CreateQuizDto, UpdateQuizDto, SubmitQuizDto, CreateQuestionDto, UpdateQuestionDto, ReorderQuestionsDto } from './dto/quizzes.dto';

@Injectable()
export class QuizzesService {
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

  async create(userId: string, userRoles: string[], dto: CreateQuizDto) {
    await this.assertLessonAccess(dto.lessonId, userId, userRoles);

    const { questions, ...quizData } = dto;
    return this.prisma.quiz.create({
      data: {
        ...quizData,
        questions: questions
          ? {
              create: questions.map((q, i) => ({
                ...q,
                options: q.options as Prisma.InputJsonValue,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: { questions: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async findById(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async update(id: string, userId: string, userRoles: string[], dto: UpdateQuizDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { lesson: { include: { subtopic: { include: { topic: { include: { course: true } } } } } } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    this.permissions.assert(userId, userRoles, quiz.lesson.subtopic.topic.course, 'edit_content');

    return this.prisma.quiz.update({
      where: { id },
      data: dto,
      include: { questions: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async delete(id: string, userId: string, userRoles: string[]) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { lesson: { include: { subtopic: { include: { topic: { include: { course: true } } } } } } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    this.permissions.assert(userId, userRoles, quiz.lesson.subtopic.topic.course, 'edit_content');

    return this.prisma.quiz.delete({ where: { id } });
  }

  async getByLesson(lessonId: string) {
    return this.prisma.quiz.findMany({
      where: { lessonId },
      include: { questions: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Question management
  async createQuestion(quizId: string, userId: string, userRoles: string[], dto: CreateQuestionDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { lesson: { include: { subtopic: { include: { topic: { include: { course: true } } } } } } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    this.permissions.assert(userId, userRoles, quiz.lesson.subtopic.topic.course, 'edit_content');

    const count = await this.prisma.question.count({ where: { quizId } });

    return this.prisma.question.create({
      data: {
        ...dto,
        options: dto.options as Prisma.InputJsonValue,
        quizId,
        sortOrder: dto.sortOrder ?? count,
      },
    });
  }

  async updateQuestion(questionId: string, userId: string, userRoles: string[], dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: { include: { lesson: { include: { subtopic: { include: { topic: { include: { course: true } } } } } } } } },
    });
    if (!question) throw new NotFoundException('Question not found');

    this.permissions.assert(userId, userRoles, question.quiz.lesson.subtopic.topic.course, 'edit_content');

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        ...dto,
        options: dto.options as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async deleteQuestion(questionId: string, userId: string, userRoles: string[]) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: { include: { lesson: { include: { subtopic: { include: { topic: { include: { course: true } } } } } } } } },
    });
    if (!question) throw new NotFoundException('Question not found');

    this.permissions.assert(userId, userRoles, question.quiz.lesson.subtopic.topic.course, 'edit_content');

    return this.prisma.question.delete({ where: { id: questionId } });
  }

  async reorderQuestions(userId: string, userRoles: string[], dto: ReorderQuestionsDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: dto.quizId },
      include: { lesson: { include: { subtopic: { include: { topic: { include: { course: true } } } } } } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    this.permissions.assert(userId, userRoles, quiz.lesson.subtopic.topic.course, 'edit_content');

    await Promise.all(
      dto.questionIds.map((id, index) =>
        this.prisma.question.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.findById(dto.quizId);
  }

  async submit(quizId: string, userId: string, dto: SubmitQuizDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    let totalPoints = 0;
    let earnedPoints = 0;

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = dto.answers[question.id];
      let isCorrect = false;

      switch (question.type) {
        case 'MULTIPLE_CHOICE':
        case 'TRUE_FALSE':
        case 'SHORT_ANSWER':
          isCorrect = !!userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
          break;
        case 'CODE':
          isCorrect = !!userAnswer && userAnswer.trim() === question.correctAnswer.trim();
          break;
        case 'MATCHING':
          const userMatches = JSON.parse(userAnswer || '{}');
          const correctMatches = JSON.parse(question.correctAnswer);
          isCorrect = JSON.stringify(userMatches) === JSON.stringify(correctMatches);
          break;
        case 'FILL_BLANK':
          const userBlanks = JSON.parse(userAnswer || '[]');
          const correctBlanks = JSON.parse(question.correctAnswer);
          isCorrect = JSON.stringify(userBlanks) === JSON.stringify(correctBlanks);
          break;
        default:
          isCorrect = !!userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
      }

      if (isCorrect) {
        earnedPoints += question.points;
      }
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passingScore;

    return this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        score,
        passed,
        answers: dto.answers,
        completedAt: new Date(),
      },
    });
  }

  async getAttempts(quizId: string, userId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { startedAt: 'desc' },
    });
  }
}
