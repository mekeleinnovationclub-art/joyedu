import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SwitchRoleDto,
  Enable2FADto,
} from './dto/auth.dto';
import type { ActiveRole, Role } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { UpdateAuthProfileDto } from './dto/profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private redis: RedisService,
    private usersService: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      throw new ConflictException('Email or username already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const verifyToken = uuidv4();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        profile: { create: {} },
      },
    });

    await this.redis.set(`verify:${verifyToken}`, user.id, 86400);

    return {
      user: this.sanitizeUser(user),
      verificationToken: verifyToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isTwoFactorEnabled) {
      if (!dto.twoFactorCode) {
        return { requiresTwoFactor: true };
      }
      const isValid = authenticator.verify({
        token: dto.twoFactorCode,
        secret: user.twoFactorSecret!,
      });
      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    const tokens = await this.generateTokens(user.id, user.email, user.roles, user.activeRole);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.updateMany({
          where: { family: stored.family },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.roles,
      stored.user.activeRole,
      stored.family,
    );

    return tokens;
  }

  async verifyEmail(token: string) {
    const userId = await this.redis.get(`verify:${token}`);
    if (!userId) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });

    await this.redis.del(`verify:${token}`);
    return { message: 'Email verified successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      const resetToken = uuidv4();
      await this.redis.set(`reset:${resetToken}`, user.id, 3600);
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const userId = await this.redis.get(`reset:${dto.token}`);
    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.redis.del(`reset:${dto.token}`);
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Password reset successfully' };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        teacherApplication: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const teacherApplication = user.teacherApplication
      ? {
          id: user.teacherApplication.id,
          userId: user.teacherApplication.userId,
          status: user.teacherApplication.status,
          bio: user.teacherApplication.bio,
          expertise: user.teacherApplication.expertise,
          experience: user.teacherApplication.experience,
          portfolioLinks: user.teacherApplication.portfolioLinks,
          socialLinks: user.teacherApplication.socialLinks,
          submittedAt: user.teacherApplication.submittedAt.toISOString(),
          reviewedAt: user.teacherApplication.reviewedAt?.toISOString(),
          reviewedBy: user.teacherApplication.reviewedBy,
          rejectionReason: user.teacherApplication.rejectionReason,
        }
      : null;

    return {
      user: this.sanitizeUser(user),
      teacherApplication,
    };
  }

  async switchRole(userId: string, dto: SwitchRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.roles.includes(dto.role as Role)) {
      if (dto.role === 'TEACHER') {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            roles: { push: 'TEACHER' as Role },
            activeRole: 'TEACHER' as ActiveRole,
          },
        });
      } else {
        throw new ForbiddenException('You do not have this role');
      }
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { activeRole: dto.role as ActiveRole },
      });
    }

    const updated = await this.prisma.user.findUnique({ where: { id: userId } });
    const tokens = await this.generateTokens(
      updated!.id,
      updated!.email,
      updated!.roles,
      updated!.activeRole,
    );

    return { user: this.sanitizeUser(updated!), ...tokens };
  }

  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const secret = authenticator.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    const otpauthUrl = authenticator.keyuri(user.email, 'JoyEdu', secret);
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    return { secret, qrCode };
  }

  async verify2FA(userId: string, dto: Enable2FADto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA not set up');
    }

    const isValid = authenticator.verify({
      token: dto.code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    return { message: '2FA enabled successfully' };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  async updateProfile(userId: string, dto: UpdateAuthProfileDto) {
    const { username, email, notifications, ...profileFields } = dto;

    if (username) {
      const existing = await this.prisma.user.findFirst({
        where: { username, NOT: { id: userId } },
      });
      if (existing) throw new ConflictException('Username already taken');
      await this.prisma.user.update({ where: { id: userId }, data: { username } });
    }

    if (email) {
      const existing = await this.prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (existing) throw new ConflictException('Email already in use');
      await this.prisma.user.update({ where: { id: userId }, data: { email } });
    }

    if (notifications) {
      await this.prisma.platformSettings.upsert({
        where: { key: `user.${userId}.notifications` },
        update: { value: notifications },
        create: {
          key: `user.${userId}.notifications`,
          value: notifications,
          category: 'user',
        },
      });
    }

    if (Object.keys(profileFields).length > 0) {
      await this.usersService.updateProfile(userId, profileFields);
    }

    return this.getCurrentUser(userId);
  }

  private async generateTokens(
    userId: string,
    email: string,
    roles: Role[],
    activeRole: ActiveRole,
    family?: string,
  ) {
    const tokenFamily = family || uuidv4();
    const payload = { sub: userId, email, roles, activeRole };

    const accessToken = this.jwt.sign(payload);

    const refreshToken = uuidv4();
    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const days = parseInt(refreshExpiresIn) || 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        family: tokenFamily,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    roles: Role[];
    activeRole: ActiveRole;
    isEmailVerified: boolean;
    subscriptionPlan: string;
  }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      roles: user.roles,
      activeRole: user.activeRole,
      isEmailVerified: user.isEmailVerified,
      subscriptionPlan: user.subscriptionPlan,
    };
  }
}
