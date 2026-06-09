import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  async generate(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.progress < 100) {
      throw new BadRequestException('Course not yet completed');
    }

    const existing = await this.prisma.certificate.findFirst({
      where: { userId, courseId },
    });
    if (existing) return existing;

    return this.prisma.certificate.create({
      data: {
        userId,
        courseId,
        certificateNumber: `JOYEDU-${uuidv4().slice(0, 8).toUpperCase()}`,
      },
    });
  }

  async getMyCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async verify(certificateNumber: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { certificateNumber },
      include: {
        user: { select: { firstName: true, lastName: true, username: true } },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }
}
