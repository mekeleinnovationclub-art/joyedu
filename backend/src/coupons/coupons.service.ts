import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CoursePermissionsService } from '../common/services/course-permissions.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './dto/coupons.dto';

@Injectable()
export class CouponsService {
  constructor(
    private prisma: PrismaService,
    private permissions: CoursePermissionsService,
  ) {}

  private async assertCourseAccess(courseId: string, userId: string, userRoles: string[]) {
    if (!courseId) return;
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');
    this.permissions.assert(userId, userRoles, course, 'edit_content');
    return course;
  }

  async create(userId: string, userRoles: string[], dto: CreateCouponDto) {
    if (dto.courseId) {
      await this.assertCourseAccess(dto.courseId, userId, userRoles);
    }

    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        discount: dto.discount,
        isPercent: dto.isPercent ?? true,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        courseId: dto.courseId,
      },
    });
  }

  async findById(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async update(id: string, userId: string, userRoles: string[], dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');

    if (coupon.courseId) {
      await this.assertCourseAccess(coupon.courseId, userId, userRoles);
    }

    if (dto.code) {
      const existing = await this.prisma.coupon.findUnique({
        where: { code: dto.code.toUpperCase() },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Coupon code already exists');
      }
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        code: dto.code ? dto.code.toUpperCase() : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async delete(id: string, userId: string, userRoles: string[]) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');

    if (coupon.courseId) {
      await this.assertCourseAccess(coupon.courseId, userId, userRoles);
    }

    return this.prisma.coupon.delete({
      where: { id },
    });
  }

  async getByCourse(courseId: string) {
    return this.prisma.coupon.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAll() {
    return this.prisma.coupon.findMany({
      where: { isActive: true },
      include: { course: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async validate(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
      include: { course: true },
    });

    if (!coupon) {
      throw new BadRequestException('Invalid coupon code');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is not active');
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (coupon.courseId && dto.courseId && coupon.courseId !== dto.courseId) {
      throw new BadRequestException('Coupon is not valid for this course');
    }

    return {
      valid: true,
      discount: coupon.discount,
      isPercent: coupon.isPercent,
      courseId: coupon.courseId,
    };
  }

  async incrementUsage(id: string) {
    return this.prisma.coupon.update({
      where: { id },
      data: { usedCount: { increment: 1 } },
    });
  }
}
