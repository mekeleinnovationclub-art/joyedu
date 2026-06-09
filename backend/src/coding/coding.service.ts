import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateChallengeDto, SubmitCodeDto, RunCodeDto } from './dto/coding.dto';
import { generateSlug } from '../common/utils/slug.util';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import * as vm from 'vm';

@Injectable()
export class CodingService {
  constructor(private prisma: PrismaService) {}

  async createChallenge(dto: CreateChallengeDto) {
    const slug = generateSlug(dto.title);
    return this.prisma.codingChallenge.create({
      data: {
        ...dto,
        slug,
        points: dto.points || 10,
        testCases: dto.testCases as Prisma.InputJsonValue,
      },
    });
  }

  async findAll(query: PaginationDto & { difficulty?: string; language?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.language) where.language = query.language;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [challenges, total] = await Promise.all([
      this.prisma.codingChallenge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          language: true,
          points: true,
          _count: { select: { submissions: true } },
        },
      }),
      this.prisma.codingChallenge.count({ where }),
    ]);

    return new PaginatedResult(challenges, total, page, limit);
  }

  async findBySlug(slug: string) {
    const challenge = await this.prisma.codingChallenge.findUnique({
      where: { slug },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async submitCode(challengeId: string, userId: string, dto: SubmitCodeDto) {
    const challenge = await this.prisma.codingChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const result = this.executeCode(dto.code, challenge.testCases as Record<string, unknown>[]);

    return this.prisma.codingSubmission.create({
      data: {
        challengeId,
        userId,
        code: dto.code,
        status: result.passed ? 'PASSED' : 'FAILED',
        output: result.output,
        executionTime: result.executionTime,
      },
    });
  }

  async runCode(dto: RunCodeDto) {
    try {
      const startTime = Date.now();
      const context = vm.createContext({ console: { log: (...args: unknown[]) => args.join(' ') } });
      const result = vm.runInContext(dto.code, context, { timeout: 5000 });
      const executionTime = Date.now() - startTime;
      return { output: String(result ?? ''), executionTime, error: null };
    } catch (error) {
      return {
        output: null,
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Execution error',
      };
    }
  }

  async getUserSubmissions(userId: string, challengeId?: string) {
    const where: Record<string, unknown> = { userId };
    if (challengeId) where.challengeId = challengeId;

    return this.prisma.codingSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private executeCode(code: string, testCases: Record<string, unknown>[]) {
    const startTime = Date.now();
    const outputs: string[] = [];
    let allPassed = true;

    try {
      for (const testCase of testCases) {
        const context = vm.createContext({
          console: { log: (...args: unknown[]) => outputs.push(args.join(' ')) },
        });
        const wrappedCode = `${code}\n${testCase.test || ''}`;
        const result = vm.runInContext(wrappedCode, context, { timeout: 5000 });
        if (testCase.expected !== undefined && result !== testCase.expected) {
          allPassed = false;
          outputs.push(`Test failed: expected ${testCase.expected}, got ${result}`);
        }
      }
    } catch (error) {
      allPassed = false;
      outputs.push(error instanceof Error ? error.message : 'Runtime error');
    }

    return {
      passed: allPassed,
      output: outputs.join('\n'),
      executionTime: Date.now() - startTime,
    };
  }
}
