import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateTeacherApplicationDto, UpdateTeacherApplicationDto } from './dto/teacher-applications.dto';

@Injectable()
export class TeacherApplicationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTeacherApplicationDto) {
    const existing = await this.prisma.teacherApplication.findFirst({
      where: { userId },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        throw new ForbiddenException('You already have a pending application');
      }
      if (existing.status === 'APPROVED') {
        throw new ForbiddenException('You are already a teacher');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.roles.includes('TEACHER')) {
      throw new ForbiddenException('You are already a teacher');
    }

    const application = await this.prisma.teacherApplication.create({
      data: {
        userId,
        bio: dto.bio,
        expertise: dto.expertise,
        experience: dto.experience,
        portfolioLinks: dto.portfolioLinks,
        socialLinks: dto.socialLinks,
        status: 'PENDING',
      },
    });

    return {
      id: application.id,
      userId: application.userId,
      status: application.status,
      bio: application.bio,
      expertise: application.expertise,
      experience: application.experience,
      portfolioLinks: application.portfolioLinks,
      socialLinks: application.socialLinks,
      submittedAt: application.submittedAt.toISOString(),
    };
  }

  async findByUserId(userId: string) {
    const application = await this.prisma.teacherApplication.findFirst({
      where: { userId },
    });

    if (!application) {
      return null;
    }

    return {
      id: application.id,
      userId: application.userId,
      status: application.status,
      bio: application.bio,
      expertise: application.expertise,
      experience: application.experience,
      portfolioLinks: application.portfolioLinks,
      socialLinks: application.socialLinks,
      submittedAt: application.submittedAt.toISOString(),
      reviewedAt: application.reviewedAt?.toISOString(),
      reviewedBy: application.reviewedBy,
      rejectionReason: application.rejectionReason,
    };
  }

  async getStatus(userId: string) {
    const application = await this.prisma.teacherApplication.findFirst({
      where: { userId },
      select: { status: true },
    });

    if (!application) {
      return { status: null };
    }

    return { status: application.status };
  }

  async update(userId: string, dto: UpdateTeacherApplicationDto) {
    const application = await this.prisma.teacherApplication.findFirst({
      where: { userId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== 'PENDING') {
      throw new ForbiddenException('Can only update pending applications');
    }

    const updated = await this.prisma.teacherApplication.update({
      where: { id: application.id },
      data: dto,
    });

    return {
      id: updated.id,
      userId: updated.userId,
      status: updated.status,
      bio: updated.bio,
      expertise: updated.expertise,
      experience: updated.experience,
      portfolioLinks: updated.portfolioLinks,
      socialLinks: updated.socialLinks,
      submittedAt: updated.submittedAt.toISOString(),
      reviewedAt: updated.reviewedAt?.toISOString(),
      reviewedBy: updated.reviewedBy,
      rejectionReason: updated.rejectionReason,
    };
  }
}
