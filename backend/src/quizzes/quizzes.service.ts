import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateQuizDto, SubmitQuizDto } from './dto/quizzes.dto';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQuizDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

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
      include: { questions: true },
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
      if (userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
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
