import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import type { Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CourseModerationDto } from './dto/course-moderation.dto';
import { PayoutActionDto } from './dto/payout-action.dto';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { CreateFeatureFlagDto } from './dto/feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/feature-flag.dto';
import { CreatePlatformSettingDto } from './dto/platform-settings.dto';
import { UpdatePlatformSettingDto } from './dto/platform-settings.dto';
import { AuditLogFilterDto } from './dto/audit-log-filter.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [users, courses, enrollments, transactions] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.course.count({ where: { deletedAt: null } }),
      this.prisma.enrollment.count(),
      this.prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalUsers: users,
      totalCourses: courses,
      totalEnrollments: enrollments,
      totalRevenue: Number(transactions._sum.amount || 0),
      totalTransactions: transactions._count,
    };
  }

  async getUsers(query: PaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          roles: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return new PaginatedResult(users, total, page, limit);
  }

  async approveTeacher(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const roles = user.roles.includes('TEACHER') ? user.roles : [...user.roles, 'TEACHER' as Role];
    return this.prisma.user.update({
      where: { id: userId },
      data: { roles },
    });
  }

  async toggleUserActive(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }

  async getAuditLogs(query: PaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);

    return new PaginatedResult(logs, total, page, limit);
  }

  async getFeatureFlags(query?: PaginationDto) {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const [flags, total] = await Promise.all([
      this.prisma.featureFlag.findMany({
        skip,
        take: limit,
        orderBy: { key: 'asc' },
      }),
      this.prisma.featureFlag.count(),
    ]);

    return new PaginatedResult(flags, total, page, limit);
  }

  async toggleFeatureFlag(id: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!flag) throw new NotFoundException('Feature flag not found');

    return this.prisma.featureFlag.update({
      where: { id },
      data: { isEnabled: !flag.isEnabled },
    });
  }

  async createAuditLog(userId: string | null, action: string, entity: string, entityId?: string, metadata?: Prisma.InputJsonValue) {
    return this.prisma.auditLog.create({
      data: { userId, action, entity, entityId, metadata },
    });
  }

  async getPlatformAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [newUsers, newEnrollments, recentTransactions] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } }),
      this.prisma.enrollment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.transaction.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, status: 'COMPLETED' },
        select: { amount: true, createdAt: true },
      }),
    ]);

    const recentRevenue = recentTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      last30Days: {
        newUsers,
        newEnrollments,
        revenue: recentRevenue,
        transactions: recentTransactions.length,
      },
    };
  }

  async getCourses(query: PaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { enrollments: true, reviews: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return new PaginatedResult(courses, total, page, limit);
  }

  async getPayouts(query: PaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.payout.count(),
    ]);

    return new PaginatedResult(payouts, total, page, limit);
  }

  async getTransactions(query: PaginationDto & { status?: string; paymentMethod?: string; courseId?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.paymentMethod) {
      where.paymentMethod = query.paymentMethod;
    }
    if (query.courseId) {
      where.courseId = query.courseId;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          course: { select: { id: true, title: true, slug: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return new PaginatedResult(transactions, total, page, limit);
  }

  async getPaymentStats() {
    const [
      totalRevenue,
      stripeRevenue,
      telebirrRevenue,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedPayments,
      paymentMethods,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { status: 'COMPLETED', paymentMethod: 'STRIPE' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { status: 'COMPLETED', paymentMethod: 'TELEBIRR' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.transaction.count({ where: { status: 'COMPLETED' } }),
      this.prisma.transaction.count({ where: { status: 'FAILED' } }),
      this.prisma.transaction.count({ where: { status: 'PENDING' } }),
      this.prisma.transaction.count({ where: { status: 'REFUNDED' } }),
      this.prisma.transaction.groupBy({
        by: ['paymentMethod'],
        _count: true,
      }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount ? Number(totalRevenue._sum.amount) : 0,
      stripeRevenue: {
        amount: stripeRevenue._sum.amount ? Number(stripeRevenue._sum.amount) : 0,
        count: stripeRevenue._count,
      },
      telebirrRevenue: {
        amount: telebirrRevenue._sum.amount ? Number(telebirrRevenue._sum.amount) : 0,
        count: telebirrRevenue._count,
      },
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedPayments,
      paymentMethods: paymentMethods.reduce((acc, item) => {
        acc[item.paymentMethod] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async getChallenges(query: PaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
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
        include: {
          _count: { select: { submissions: true } },
        },
      }),
      this.prisma.codingChallenge.count({ where }),
    ]);

    return new PaginatedResult(challenges, total, page, limit);
  }

  // ==================== USER MANAGEMENT ====================

  async createUser(createUserDto: CreateUserDto, adminId: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { username: createUserDto.username },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        passwordHash,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        roles: createUserDto.roles,
        bio: createUserDto.bio,
        avatar: createUserDto.avatar,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        roles: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    await this.createAuditLog(adminId, 'USER_CREATED', 'User', user.id, { email: user.email, roles: user.roles });

    return user;
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        roles: true,
        activeRole: true,
        isEmailVerified: true,
        isActive: true,
        isTwoFactorEnabled: true,
        subscriptionPlan: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        _count: {
          select: {
            enrollments: true,
            taughtCourses: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admin from modifying their own role
    if (userId === adminId && updateUserDto.roles) {
      throw new ForbiddenException('Cannot modify your own roles');
    }

    // Prevent admin from deactivating themselves
    if (userId === adminId && updateUserDto.isActive === false) {
      throw new ForbiddenException('Cannot deactivate yourself');
    }

    // Prevent removing the last admin
    if (updateUserDto.roles && !updateUserDto.roles.includes('ADMIN') && user.roles.includes('ADMIN')) {
      const adminCount = await this.prisma.user.count({
        where: {
          roles: { has: 'ADMIN' },
          isActive: true,
          deletedAt: null,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin role');
      }
    }

    // Prevent role arrays from becoming empty
    if (updateUserDto.roles && updateUserDto.roles.length === 0) {
      throw new BadRequestException('Users must have at least one role');
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (updateUserDto.email) updateData.email = updateUserDto.email;
    if (updateUserDto.username) updateData.username = updateUserDto.username;
    if (updateUserDto.firstName) updateData.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) updateData.lastName = updateUserDto.lastName;
    if (updateUserDto.bio !== undefined) updateData.bio = updateUserDto.bio;
    if (updateUserDto.avatar !== undefined) updateData.avatar = updateUserDto.avatar;
    if (updateUserDto.isActive !== undefined) updateData.isActive = updateUserDto.isActive;
    if (updateUserDto.isEmailVerified !== undefined) updateData.isEmailVerified = updateUserDto.isEmailVerified;
    if (updateUserDto.roles) updateData.roles = updateUserDto.roles;
    if (updateUserDto.password) {
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        roles: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    await this.createAuditLog(adminId, 'USER_UPDATED', 'User', userId, { changes: { ...updateUserDto } });

    return updatedUser;
  }

  async softDeleteUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admin from deleting themselves
    if (userId === adminId) {
      throw new ForbiddenException('Cannot delete yourself');
    }

    // Prevent deleting the last admin
    if (user.roles.includes('ADMIN')) {
      const adminCount = await this.prisma.user.count({
        where: {
          roles: { has: 'ADMIN' },
          isActive: true,
          deletedAt: null,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    await this.createAuditLog(adminId, 'USER_DELETED', 'User', userId, { email: user.email });

    return { message: 'User soft deleted successfully' };
  }

  async suspendUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent admin from suspending themselves
    if (userId === adminId) {
      throw new ForbiddenException('Cannot suspend yourself');
    }

    if (user.isActive) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      await this.createAuditLog(adminId, 'USER_SUSPENDED', 'User', userId, { email: user.email });
    }

    return { message: 'User suspended successfully' };
  }

  async reactivateUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      await this.createAuditLog(adminId, 'USER_REACTIVATED', 'User', userId, { email: user.email });
    }

    return { message: 'User reactivated successfully' };
  }

  async resetUserPassword(userId: string, resetPasswordDto: ResetPasswordDto, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.createAuditLog(adminId, 'PASSWORD_RESET', 'User', userId, { email: user.email });

    return { message: 'Password reset successfully' };
  }

  async verifyTeacher(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.roles.includes('TEACHER')) {
      throw new BadRequestException('User is already a teacher');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { roles: [...user.roles, 'TEACHER'] },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
      },
    });

    await this.createAuditLog(adminId, 'TEACHER_VERIFIED', 'User', userId, { email: user.email });

    return updatedUser;
  }

  async removeTeacherRole(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.roles.includes('TEACHER')) {
      throw new BadRequestException('User is not a teacher');
    }

    // Prevent removing the last admin role
    if (user.roles.includes('ADMIN')) {
      const adminCount = await this.prisma.user.count({
        where: {
          roles: { has: 'ADMIN' },
          isActive: true,
          deletedAt: null,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin role');
      }
    }

    const updatedRoles = user.roles.filter((role) => role !== 'TEACHER');

    // Prevent role arrays from becoming empty
    if (updatedRoles.length === 0) {
      throw new BadRequestException('Users must have at least one role');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { roles: updatedRoles },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
      },
    });

    await this.createAuditLog(adminId, 'TEACHER_ROLE_REMOVED', 'User', userId, { email: user.email });

    return updatedUser;
  }

  async getUsersWithFilters(filter: UserFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    if (filter.search) {
      where.OR = [
        { email: { contains: filter.search, mode: 'insensitive' } },
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { username: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.role) {
      where.roles = { has: filter.role };
    }

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.isEmailVerified !== undefined) {
      where.isEmailVerified = filter.isEmailVerified;
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (filter.dateSort) {
      orderBy.createdAt = filter.dateSort === 'newest' ? 'desc' : 'asc';
    } else if (filter.nameSort) {
      orderBy.username = filter.nameSort;
    } else if (filter.sortBy) {
      orderBy[filter.sortBy] = filter.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          roles: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
          _count: {
            select: {
              enrollments: true,
              taughtCourses: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return new PaginatedResult(users, total, page, limit);
  }

  // ==================== COURSE MANAGEMENT ====================

  async moderateCourse(courseId: string, moderationDto: CourseModerationDto, adminId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId, deletedAt: null } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updateData: Prisma.CourseUpdateInput = {};
    if (moderationDto.title) updateData.title = moderationDto.title;
    if (moderationDto.description) updateData.description = moderationDto.description;
    if (moderationDto.price !== undefined) updateData.price = moderationDto.price;
    if (moderationDto.status) updateData.status = moderationDto.status;
    if (moderationDto.isFeatured !== undefined) updateData.isFeatured = moderationDto.isFeatured;

    // Never allow instructorId to be modified by admins - preserves teacher ownership
    // Admins can only moderate status and featured status, not become course owners

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
        category: true,
      },
    });

    await this.createAuditLog(adminId, 'COURSE_MODERATED', 'Course', courseId, {
      status: moderationDto.status,
      isFeatured: moderationDto.isFeatured,
      reason: moderationDto.moderationReason,
    });

    return updatedCourse;
  }

  async publishCourse(courseId: string, adminId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId, deletedAt: null } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.createAuditLog(adminId, 'COURSE_PUBLISHED', 'Course', courseId, { title: course.title });

    return updatedCourse;
  }

  async unpublishCourse(courseId: string, adminId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId, deletedAt: null } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: { status: 'DRAFT' },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.createAuditLog(adminId, 'COURSE_UNPUBLISHED', 'Course', courseId, { title: course.title });

    return updatedCourse;
  }

  async featureCourse(courseId: string, adminId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId, deletedAt: null } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: { isFeatured: true },
    });

    await this.createAuditLog(adminId, 'COURSE_FEATURED', 'Course', courseId, { title: course.title });

    return updatedCourse;
  }

  async unfeatureCourse(courseId: string, adminId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId, deletedAt: null } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: { isFeatured: false },
    });

    await this.createAuditLog(adminId, 'COURSE_UNFEATURED', 'Course', courseId, { title: course.title });

    return updatedCourse;
  }

  async archiveCourse(courseId: string, adminId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId, deletedAt: null } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: { status: 'ARCHIVED' },
    });

    await this.createAuditLog(adminId, 'COURSE_ARCHIVED', 'Course', courseId, { title: course.title });

    return updatedCourse;
  }

  async deleteCourse(courseId: string, adminId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId, deletedAt: null } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.prisma.course.update({
      where: { id: courseId },
      data: { deletedAt: new Date() },
    });

    await this.createAuditLog(adminId, 'COURSE_DELETED', 'Course', courseId, { title: course.title });

    return { message: 'Course deleted successfully' };
  }

  // ==================== COMPREHENSIVE ANALYTICS ====================

  async getComprehensiveAnalytics(filter: AnalyticsFilterDto) {
    const now = new Date();
    const startDate = filter.startDate ? new Date(filter.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = filter.endDate ? new Date(filter.endDate) : now;

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const [
      totalUsers,
      activeUsers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalRevenue,
      newUsers,
      newEnrollments,
      teacherPerformance,
      studentEngagement,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          lastLoginAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.course.count({ where: { deletedAt: null } }),
      this.prisma.course.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      this.prisma.enrollment.count({
        where: {
          user: { deletedAt: null },
          course: { deletedAt: null },
        },
      }),
      this.prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
      this.prisma.enrollment.count({
        where: { 
          createdAt: { gte: startDate, lte: endDate },
          user: { deletedAt: null },
          course: { deletedAt: null },
        },
      }),
      this.getTeacherPerformance(filter.teacherId),
      this.getStudentEngagement(startDate, endDate),
    ]);

    const revenue = Number(totalRevenue._sum.amount || 0);

    return {
      overview: {
        totalUsers,
        activeUsers,
        totalCourses,
        publishedCourses,
        totalEnrollments,
        totalRevenue: revenue,
      },
      period: {
        newUsers,
        newEnrollments,
        startDate,
        endDate,
      },
      teacherPerformance,
      studentEngagement,
    };
  }

  private async getTeacherPerformance(teacherId?: string) {
    const where: Record<string, unknown> = {};
    if (teacherId) {
      where.id = teacherId;
    }

    const teachers = await this.prisma.user.findMany({
      where: {
        roles: { has: 'TEACHER' },
        deletedAt: null,
        ...where,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        taughtCourses: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            _count: { select: { enrollments: true, reviews: true } },
            reviews: {
              select: { rating: true },
            },
          },
        },
        payoutsReceived: {
          where: { status: 'COMPLETED' },
          select: { amount: true },
        },
      },
    });

    return teachers.map((teacher) => {
      const totalEnrollments = teacher.taughtCourses.reduce((sum, course) => sum + course._count.enrollments, 0);
      const totalReviews = teacher.taughtCourses.reduce((sum, course) => sum + course._count.reviews, 0);
      const avgRating =
        totalReviews > 0
          ? teacher.taughtCourses.reduce((sum, course) => {
              const courseAvg = course.reviews.length > 0
                ? course.reviews.reduce((rSum, r) => rSum + r.rating, 0) / course.reviews.length
                : 0;
              return sum + courseAvg;
            }, 0) / teacher.taughtCourses.length
          : 0;
      const totalEarnings = teacher.payoutsReceived.reduce((sum, payout) => sum + Number(payout.amount), 0);

      return {
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
        totalCourses: teacher.taughtCourses.length,
        totalEnrollments,
        totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        totalEarnings,
      };
    });
  }

  private async getStudentEngagement(startDate: Date, endDate: Date) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { 
        createdAt: { gte: startDate, lte: endDate },
        user: { deletedAt: null },
        course: { deletedAt: null },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        course: { select: { id: true, title: true } },
      },
    });

    const lessonProgress = await this.prisma.lessonProgress.findMany({
      where: { 
        createdAt: { gte: startDate, lte: endDate },
        enrollment: { 
          user: { deletedAt: null },
          course: { deletedAt: null },
        },
      },
    });

    const completedCourses = await this.prisma.enrollment.count({
      where: { 
        completedAt: { gte: startDate, lte: endDate },
        user: { deletedAt: null },
        course: { deletedAt: null },
      },
    });

    return {
      totalEnrollmentsInPeriod: enrollments.length,
      uniqueStudents: new Set(enrollments.map((e) => e.userId)).size,
      lessonsCompleted: lessonProgress.filter((lp) => lp.completed).length,
      coursesCompleted: completedCourses,
    };
  }

  async getGrowthMetrics(filter: AnalyticsFilterDto) {
    const granularity = filter.granularity || 'daily';
    const now = new Date();
    const startDate = filter.startDate ? new Date(filter.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = filter.endDate ? new Date(filter.endDate) : now;

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const timeSeriesData = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const periodStart = new Date(currentDate);
      let periodEnd: Date;

      switch (granularity) {
        case 'daily':
          periodEnd = new Date(currentDate);
          periodEnd.setHours(23, 59, 59, 999);
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          periodEnd = new Date(currentDate);
          periodEnd.setDate(periodEnd.getDate() + 6);
          periodEnd.setHours(23, 59, 59, 999);
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          periodEnd = new Date(currentDate);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          periodEnd.setDate(0);
          periodEnd.setHours(23, 59, 59, 999);
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }

      const [newUsers, newEnrollments, revenue] = await Promise.all([
        this.prisma.user.count({
          where: {
            createdAt: { gte: periodStart, lte: periodEnd },
            deletedAt: null,
          },
        }),
        this.prisma.enrollment.count({
          where: { 
            createdAt: { gte: periodStart, lte: periodEnd },
            user: { deletedAt: null },
            course: { deletedAt: null },
          },
        }),
        this.prisma.transaction.aggregate({
          where: {
            createdAt: { gte: periodStart, lte: periodEnd },
            status: 'COMPLETED',
          },
          _sum: { amount: true },
        }),
      ]);

      timeSeriesData.push({
        period: periodStart.toISOString().split('T')[0],
        newUsers,
        newEnrollments,
        revenue: Number(revenue._sum.amount || 0),
      });
    }

    return timeSeriesData;
  }

  // ==================== PAYOUT MANAGEMENT ====================

  async approvePayout(payoutId: string, payoutActionDto: PayoutActionDto, adminId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: { instructor: true },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== 'PENDING') {
      throw new BadRequestException('Payout is not in pending status');
    }

    const updatedPayout = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: payoutActionDto.status,
      },
      include: { instructor: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    await this.createAuditLog(adminId, 'PAYOUT_APPROVED', 'Payout', payoutId, {
      amount: payout.amount,
      instructorId: payout.instructorId,
      notes: payoutActionDto.notes,
    });

    return updatedPayout;
  }

  async rejectPayout(payoutId: string, payoutActionDto: PayoutActionDto, adminId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: { instructor: true },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== 'PENDING') {
      throw new BadRequestException('Payout is not in pending status');
    }

    const updatedPayout = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'FAILED',
      },
      include: { instructor: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    await this.createAuditLog(adminId, 'PAYOUT_REJECTED', 'Payout', payoutId, {
      amount: payout.amount,
      instructorId: payout.instructorId,
      notes: payoutActionDto.notes,
    });

    return updatedPayout;
  }

  async getPayoutHistory(instructorId?: string, query?: PaginationDto) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (instructorId) {
      where.instructorId = instructorId;
    }

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.payout.count({ where }),
    ]);

    return new PaginatedResult(payouts, total, page, limit);
  }

  async getTeacherEarnings(instructorId: string) {
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        taughtCourses: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            price: true,
            _count: { select: { enrollments: true } },
          },
        },
        payoutsReceived: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            status: true,
            periodStart: true,
            periodEnd: true,
            createdAt: true,
          },
        },
      },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    const totalCourseRevenue = instructor.taughtCourses.reduce(
      (sum, course) => sum + Number(course.price) * course._count.enrollments,
      0,
    );
    const totalPaidOut = instructor.payoutsReceived
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingPayouts = instructor.payoutsReceived
      .filter((p) => p.status === 'PENDING')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      instructor: {
        id: instructor.id,
        name: `${instructor.firstName} ${instructor.lastName}`,
        email: instructor.email,
      },
      totalCourseRevenue,
      totalPaidOut,
      pendingPayouts,
      availableBalance: totalCourseRevenue - totalPaidOut - pendingPayouts,
      courses: instructor.taughtCourses.map((course) => ({
        id: course.id,
        title: course.title,
        price: Number(course.price),
        enrollments: course._count.enrollments,
        revenue: Number(course.price) * course._count.enrollments,
      })),
      payoutHistory: instructor.payoutsReceived,
    };
  }

  async exportPayouts(filter: { startDate?: string; endDate?: string }) {
    const where: Record<string, unknown> = {};
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) (where.createdAt as Record<string, unknown>).gte = new Date(filter.startDate);
      if (filter.endDate) (where.createdAt as Record<string, unknown>).lte = new Date(filter.endDate);
    }

    const payouts = await this.prisma.payout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return {
      data: payouts.map((payout) => ({
        id: payout.id,
        instructorName: `${payout.instructor.firstName} ${payout.instructor.lastName}`,
        instructorEmail: payout.instructor.email,
        amount: Number(payout.amount),
        currency: payout.currency,
        status: payout.status,
        periodStart: payout.periodStart,
        periodEnd: payout.periodEnd,
        createdAt: payout.createdAt,
      })),
      total: payouts.length,
    };
  }

  // ==================== CHALLENGE MANAGEMENT ====================

  async createChallenge(createChallengeDto: CreateChallengeDto, adminId: string) {
    const existingChallenge = await this.prisma.codingChallenge.findUnique({
      where: { slug: createChallengeDto.slug },
    });

    if (existingChallenge) {
      throw new ConflictException('Challenge with this slug already exists');
    }

    const challenge = await this.prisma.codingChallenge.create({
      data: {
        title: createChallengeDto.title,
        slug: createChallengeDto.slug,
        description: createChallengeDto.description,
        difficulty: createChallengeDto.difficulty,
        language: createChallengeDto.language,
        starterCode: createChallengeDto.starterCode,
        solutionCode: createChallengeDto.solutionCode,
        testCases: createChallengeDto.testCases,
        hints: createChallengeDto.hints || [],
        points: createChallengeDto.points || 10,
      },
    });

    await this.createAuditLog(adminId, 'CHALLENGE_CREATED', 'CodingChallenge', challenge.id, {
      title: challenge.title,
      slug: challenge.slug,
    });

    return challenge;
  }

  async updateChallenge(challengeId: string, updateChallengeDto: UpdateChallengeDto, adminId: string) {
    const challenge = await this.prisma.codingChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const updatedChallenge = await this.prisma.codingChallenge.update({
      where: { id: challengeId },
      data: updateChallengeDto,
    });

    await this.createAuditLog(adminId, 'CHALLENGE_UPDATED', 'CodingChallenge', challengeId, {
      title: challenge.title,
    });

    return updatedChallenge;
  }

  async deleteChallenge(challengeId: string, adminId: string) {
    const challenge = await this.prisma.codingChallenge.findUnique({ where: { id: challengeId, deletedAt: null } });
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    await this.prisma.codingChallenge.update({
      where: { id: challengeId },
      data: { deletedAt: new Date() },
    });

    await this.createAuditLog(adminId, 'CHALLENGE_DELETED', 'CodingChallenge', challengeId, {
      title: challenge.title,
    });

    return { message: 'Challenge deleted successfully' };
  }

  async getChallengeById(challengeId: string) {
    const challenge = await this.prisma.codingChallenge.findUnique({
      where: { id: challengeId },
      include: {
        _count: { select: { submissions: true } },
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return challenge;
  }

  // ==================== RECYCLE BIN ====================

  async getDeletedItems(query: PaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [deletedUsers, deletedCourses, deletedChallenges] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: { not: null } },
        skip,
        take: limit,
        orderBy: { deletedAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          roles: true,
          deletedAt: true,
        },
      }),
      this.prisma.course.findMany({
        where: { deletedAt: { not: null } },
        skip,
        take: limit,
        orderBy: { deletedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          instructorId: true,
          deletedAt: true,
        },
      }),
      this.prisma.codingChallenge.findMany({
        where: { deletedAt: { not: null } },
        skip,
        take: limit,
        orderBy: { deletedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          deletedAt: true,
        },
      }),
    ]);

    return {
      users: deletedUsers,
      courses: deletedCourses,
      challenges: deletedChallenges,
    };
  }

  async restoreUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.deletedAt) {
      throw new BadRequestException('User is not deleted');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
    });

    await this.createAuditLog(adminId, 'USER_RESTORED', 'User', userId, { email: user.email });

    return { message: 'User restored successfully' };
  }

  async restoreCourse(courseId: string, adminId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!course.deletedAt) {
      throw new BadRequestException('Course is not deleted');
    }

    await this.prisma.course.update({
      where: { id: courseId },
      data: { deletedAt: null },
    });

    await this.createAuditLog(adminId, 'COURSE_RESTORED', 'Course', courseId, { title: course.title });

    return { message: 'Course restored successfully' };
  }

  async restoreChallenge(challengeId: string, adminId: string) {
    const challenge = await this.prisma.codingChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (!challenge.deletedAt) {
      throw new BadRequestException('Challenge is not deleted');
    }

    await this.prisma.codingChallenge.update({
      where: { id: challengeId },
      data: { deletedAt: null },
    });

    await this.createAuditLog(adminId, 'CHALLENGE_RESTORED', 'CodingChallenge', challengeId, {
      title: challenge.title,
    });

    return { message: 'Challenge restored successfully' };
  }

  // ==================== AUDIT LOG MANAGEMENT ====================

  async getAuditLogsWithFilters(filter: AuditLogFilterDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filter.action) {
      where.action = { contains: filter.action, mode: 'insensitive' };
    }

    if (filter.entity) {
      where.entity = { contains: filter.entity, mode: 'insensitive' };
    }

    if (filter.entityId) {
      where.entityId = filter.entityId;
    }

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) (where.createdAt as Record<string, unknown>).gte = new Date(filter.startDate);
      if (filter.endDate) (where.createdAt as Record<string, unknown>).lte = new Date(filter.endDate);
    }

    if (filter.search) {
      where.OR = [
        { action: { contains: filter.search, mode: 'insensitive' } },
        { entity: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return new PaginatedResult(logs, total, page, limit);
  }

  // ==================== FEATURE FLAG MANAGEMENT ====================

  async createFeatureFlag(createFeatureFlagDto: CreateFeatureFlagDto, adminId: string) {
    const existingFlag = await this.prisma.featureFlag.findUnique({
      where: { key: createFeatureFlagDto.key },
    });

    if (existingFlag) {
      throw new ConflictException('Feature flag with this key already exists');
    }

    const flag = await this.prisma.featureFlag.create({
      data: {
        key: createFeatureFlagDto.key,
        name: createFeatureFlagDto.name,
        description: createFeatureFlagDto.description,
        isEnabled: createFeatureFlagDto.isEnabled ?? false,
        isBeta: createFeatureFlagDto.isBeta ?? false,
        isMaintenance: createFeatureFlagDto.isMaintenance ?? false,
      },
    });

    await this.createAuditLog(adminId, 'FEATURE_FLAG_CREATED', 'FeatureFlag', flag.id, {
      key: flag.key,
      name: flag.name,
    });

    return flag;
  }

  async updateFeatureFlag(flagId: string, updateFeatureFlagDto: UpdateFeatureFlagDto, adminId: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { id: flagId } });
    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }

    const updatedFlag = await this.prisma.featureFlag.update({
      where: { id: flagId },
      data: updateFeatureFlagDto,
    });

    await this.createAuditLog(adminId, 'FEATURE_FLAG_UPDATED', 'FeatureFlag', flagId, {
      key: flag.key,
      changes: { ...updateFeatureFlagDto },
    });

    return updatedFlag;
  }

  async deleteFeatureFlag(flagId: string, adminId: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { id: flagId } });
    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }

    await this.prisma.featureFlag.delete({ where: { id: flagId } });

    await this.createAuditLog(adminId, 'FEATURE_FLAG_DELETED', 'FeatureFlag', flagId, {
      key: flag.key,
    });

    return { message: 'Feature flag deleted successfully' };
  }

  async getFeatureFlagByKey(key: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }
    return flag;
  }

  // ==================== PLATFORM SETTINGS MANAGEMENT ====================

  async createPlatformSetting(createPlatformSettingDto: CreatePlatformSettingDto, adminId: string) {
    const existingSetting = await this.prisma.platformSettings.findUnique({
      where: { key: createPlatformSettingDto.key },
    });

    if (existingSetting) {
      throw new ConflictException('Platform setting with this key already exists');
    }

    const setting = await this.prisma.platformSettings.create({
      data: {
        key: createPlatformSettingDto.key,
        value: createPlatformSettingDto.value,
        category: createPlatformSettingDto.category,
        description: createPlatformSettingDto.description,
      },
    });

    await this.createAuditLog(adminId, 'PLATFORM_SETTING_CREATED', 'PlatformSettings', setting.id, {
      key: setting.key,
      category: setting.category,
    });

    return setting;
  }

  async updatePlatformSetting(settingId: string, updatePlatformSettingDto: UpdatePlatformSettingDto, adminId: string) {
    const setting = await this.prisma.platformSettings.findUnique({ where: { id: settingId } });
    if (!setting) {
      throw new NotFoundException('Platform setting not found');
    }

    const updatedSetting = await this.prisma.platformSettings.update({
      where: { id: settingId },
      data: updatePlatformSettingDto,
    });

    await this.createAuditLog(adminId, 'PLATFORM_SETTING_UPDATED', 'PlatformSettings', settingId, {
      key: setting.key,
      changes: { ...updatePlatformSettingDto },
    });

    return updatedSetting;
  }

  async deletePlatformSetting(settingId: string, adminId: string) {
    const setting = await this.prisma.platformSettings.findUnique({ where: { id: settingId } });
    if (!setting) {
      throw new NotFoundException('Platform setting not found');
    }

    await this.prisma.platformSettings.delete({ where: { id: settingId } });

    await this.createAuditLog(adminId, 'PLATFORM_SETTING_DELETED', 'PlatformSettings', settingId, {
      key: setting.key,
    });

    return { message: 'Platform setting deleted successfully' };
  }

  async getPlatformSettings(category?: string, query?: PaginationDto) {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = category;
    }

    const [settings, total] = await Promise.all([
      this.prisma.platformSettings.findMany({
        where,
        skip,
        take: limit,
        orderBy: { category: 'asc' },
      }),
      this.prisma.platformSettings.count({ where }),
    ]);

    return new PaginatedResult(settings, total, page, limit);
  }

  async getPlatformSettingByKey(key: string) {
    const setting = await this.prisma.platformSettings.findUnique({ where: { key } });
    if (!setting) {
      throw new NotFoundException('Platform setting not found');
    }
    return setting;
  }

  async getSettingsByCategory(category: string) {
    const settings = await this.prisma.platformSettings.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });

    return settings;
  }
}
