import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RestoreFromAuditDto, GetAuditHistoryDto } from './dto/audit-recovery.dto';

@Injectable()
export class AuditRecoveryService {
  constructor(private prisma: PrismaService) {}

  async getAuditHistory(dto: GetAuditHistoryDto) {
    const where: any = {};
    
    if (dto.entityType) {
      where.entity = dto.entityType;
    }
    if (dto.entityId) {
      where.entityId = dto.entityId;
    }
    if (dto.userId) {
      where.userId = dto.userId;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getAuditLogById(id: string) {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!auditLog) {
      throw new NotFoundException('Audit log entry not found');
    }

    return auditLog;
  }

  async restoreFromAudit(dto: RestoreFromAuditDto) {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id: dto.auditLogId },
    });

    if (!auditLog) {
      throw new NotFoundException('Audit log entry not found');
    }

    if (!auditLog.metadata) {
      throw new BadRequestException('No metadata found in audit log entry');
    }

    const metadata = auditLog.metadata as any;
    const entity = auditLog.entity;

    // Restore based on entity type
    switch (entity) {
      case 'User':
        return this.restoreUser(metadata);
      case 'Course':
        return this.restoreCourse(metadata);
      case 'Lesson':
        return this.restoreLesson(metadata);
      case 'Quiz':
        return this.restoreQuiz(metadata);
      case 'Category':
        return this.restoreCategory(metadata);
      case 'Review':
        return this.restoreReview(metadata);
      case 'Topic':
        return this.restoreTopic(metadata);
      case 'Subtopic':
        return this.restoreSubtopic(metadata);
      case 'ContentBlock':
        return this.restoreContentBlock(metadata);
      default:
        throw new BadRequestException(`Restore not implemented for entity type: ${entity}`);
    }
  }

  private async restoreUser(metadata: any) {
    const existing = await this.prisma.user.findUnique({
      where: { id: metadata.id },
    });

    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const { deletedAt, ...data } = metadata;
    return this.prisma.user.create({
      data,
    });
  }

  private async restoreCourse(metadata: any) {
    const existing = await this.prisma.course.findUnique({
      where: { id: metadata.id },
    });

    if (existing) {
      throw new BadRequestException('Course already exists');
    }

    const { deletedAt, ...data } = metadata;
    return this.prisma.course.create({
      data,
    });
  }

  private async restoreLesson(metadata: any) {
    const existing = await this.prisma.lesson.findUnique({
      where: { id: metadata.id },
    });

    if (existing) {
      throw new BadRequestException('Lesson already exists');
    }

    const { deletedAt, ...data } = metadata;
    return this.prisma.lesson.create({
      data,
    });
  }

  private async restoreQuiz(metadata: any) {
    const existing = await this.prisma.quiz.findUnique({
      where: { id: metadata.id },
    });

    if (existing) {
      throw new BadRequestException('Quiz already exists');
    }

    const { deletedAt, ...data } = metadata;
    return this.prisma.quiz.create({
      data,
    });
  }

  private async restoreCategory(metadata: any) {
    const existing = await this.prisma.category.findUnique({
      where: { id: metadata.id },
    });

    if (existing) {
      throw new BadRequestException('Category already exists');
    }

    const { deletedAt, ...data } = metadata;
    return this.prisma.category.create({
      data,
    });
  }

  private async restoreReview(metadata: any) {
    const existing = await this.prisma.review.findUnique({
      where: { id: metadata.id },
    });

    if (existing) {
      throw new BadRequestException('Review already exists');
    }

    const { deletedAt, ...data } = metadata;
    return this.prisma.review.create({
      data,
    });
  }

  private async restoreTopic(metadata: any) {
    const existing = await this.prisma.topic.findUnique({
      where: { id: metadata.id },
    });

    if (existing) {
      throw new BadRequestException('Topic already exists');
    }

    const { deletedAt, ...data } = metadata;
    return this.prisma.topic.create({
      data,
    });
  }

  private async restoreSubtopic(metadata: any) {
    const existing = await this.prisma.subtopic.findUnique({
      where: { id: metadata.id },
    });

    if (existing) {
      throw new BadRequestException('Subtopic already exists');
    }

    const { deletedAt, ...data } = metadata;
    return this.prisma.subtopic.create({
      data,
    });
  }

  private async restoreContentBlock(metadata: any) {
    const existing = await this.prisma.contentBlock.findUnique({
      where: { id: metadata.id },
    });

    if (existing) {
      throw new BadRequestException('ContentBlock already exists');
    }

    const { deletedAt, ...data } = metadata;
    return this.prisma.contentBlock.create({
      data,
    });
  }
}
