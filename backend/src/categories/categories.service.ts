import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCategoryDto } from './dto/categories.dto';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name, { lower: true, strict: true });
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Category already exists');

    return this.prisma.category.create({
      data: { ...dto, slug },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { courses: true } },
      },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
        courses: {
          where: { status: 'PUBLISHED', deletedAt: null },
          take: 20,
          include: {
            instructor: { select: { firstName: true, lastName: true } },
            _count: { select: { enrollments: true } },
          },
        },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async delete(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }
}
