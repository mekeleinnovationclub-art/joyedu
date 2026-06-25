import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CoursePermissionsService } from '../common/services/course-permissions.service';
import { Prisma } from '@prisma/client';
import { generateSlug } from '../common/utils/slug.util';
import {
  CreateContentBlockDto,
  UpdateContentBlockDto,
} from './dto/course-structure.dto';
import {
  CreateCourseWithStructureDto,
  UpdateCourseWithStructureDto,
} from './dto/course-builder.dto';

@Injectable()
export class CourseStructureService {
  constructor(
    private prisma: PrismaService,
    private permissions: CoursePermissionsService,
  ) {}

  private async assertTopicAccess(topicId: string, userId: string, userRoles: string[]) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: { course: true },
    });
    if (!topic || topic.deletedAt) throw new NotFoundException('Topic not found');
    this.permissions.assert(userId, userRoles, topic.course, 'edit_content');
    return topic;
  }

  private async assertSubtopicAccess(subtopicId: string, userId: string, userRoles: string[]) {
    const subtopic = await this.prisma.subtopic.findUnique({
      where: { id: subtopicId },
      include: { topic: { include: { course: true } } },
    });
    if (!subtopic || subtopic.deletedAt) throw new NotFoundException('Subtopic not found');
    this.permissions.assert(userId, userRoles, subtopic.topic.course, 'edit_content');
    return subtopic;
  }

  private async assertLessonAccess(lessonId: string, userId: string, userRoles: string[]) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { subtopic: { include: { topic: { include: { course: true } } } } },
    });
    if (!lesson || lesson.deletedAt) throw new NotFoundException('Lesson not found');
    this.permissions.assert(userId, userRoles, lesson.subtopic.topic.course, 'edit_content');
    return lesson;
  }

  async createContentBlock(userId: string, userRoles: string[], dto: CreateContentBlockDto) {
    await this.assertLessonAccess(dto.lessonId, userId, userRoles);
    const count = await this.prisma.contentBlock.count({
      where: { lessonId: dto.lessonId, deletedAt: null },
    });
    return this.prisma.contentBlock.create({
      data: {
        type: dto.type,
        title: dto.title,
        content: dto.content as Prisma.InputJsonValue,
        lessonId: dto.lessonId,
        sortOrder: dto.sortOrder ?? count,
      },
    });
  }

  async updateContentBlock(id: string, userId: string, userRoles: string[], dto: UpdateContentBlockDto) {
    const block = await this.prisma.contentBlock.findUnique({
      where: { id },
      include: { lesson: { include: { subtopic: { include: { topic: { include: { course: true } } } } } } },
    });
    if (!block || block.deletedAt) throw new NotFoundException('Content block not found');
    this.permissions.assert(userId, userRoles, block.lesson.subtopic.topic.course, 'edit_content');

    return this.prisma.contentBlock.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title,
        sortOrder: dto.sortOrder,
        content: dto.content as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async deleteContentBlock(id: string, userId: string, userRoles: string[]) {
    const block = await this.prisma.contentBlock.findUnique({ where: { id } });
    if (!block) throw new NotFoundException('Content block not found');
    await this.assertLessonAccess(block.lessonId, userId, userRoles);

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CONTENT_BLOCK_DELETED',
        entity: 'ContentBlock',
        entityId: id,
        metadata: block as Prisma.InputJsonValue,
      },
    });

    return this.prisma.contentBlock.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async reorderContentBlocks(lessonId: string, userId: string, userRoles: string[], ids: string[]) {
    await this.assertLessonAccess(lessonId, userId, userRoles);
    await Promise.all(
      ids.map((id, index) => this.prisma.contentBlock.update({ where: { id }, data: { sortOrder: index } })),
    );
    return { message: 'Content blocks reordered' };
  }

  async getCourseStructure(courseId: string, userId: string, userRoles: string[]) {
    const course = await this.permissions.getCourseOrThrow(courseId);
    this.permissions.assert(userId, userRoles, course, 'read');

    return this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        topics: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            subtopics: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
              include: {
                lessons: {
                  where: { deletedAt: null },
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    contentBlocks: {
                      where: { deletedAt: null },
                      orderBy: { sortOrder: 'asc' },
                    },
                    quizzes: {
                      include: {
                        questions: {
                          orderBy: { sortOrder: 'asc' },
                        },
                      },
                    },
                    exercises: true,
                    resources: true,
                  },
                },
              },
            },
          },
        },
        resources: true,
        prerequisites: {
          include: {
            prerequisite: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
              },
            },
          },
        },
        media: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        announcements: {
          orderBy: { createdAt: 'desc' },
        },
        coupons: true,
      },
    });
  }

  async createCourseWithStructure(userId: string, userRoles: string[], dto: CreateCourseWithStructureDto) {
    if (!this.permissions.isTeacher(userRoles) && !this.permissions.isAdmin(userRoles)) {
      throw new ForbiddenException('Only teachers and admins can create courses');
    }

    const slug = generateSlug(dto.title);

    // Check if slug already exists
    const existing = await this.prisma.course.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException('A course with this title already exists');
    }

    const course = await this.prisma.$transaction(async (tx) => {
      const newCourse = await tx.course.create({
        data: {
          title: dto.title,
          slug,
          description: dto.description,
          subtitle: dto.subtitle,
          shortDescription: dto.shortDescription,
          thumbnail: dto.thumbnail,
          coverImage: dto.coverImage,
          previewVideo: dto.previewVideo,
          promotionalVideo: dto.promotionalVideo,
          price: dto.price ? new Prisma.Decimal(dto.price) : new Prisma.Decimal(0),
          discountPrice: dto.discountPrice ? new Prisma.Decimal(dto.discountPrice) : null,
          difficulty: dto.difficulty || 'BEGINNER',
          categoryId: dto.categoryId,
          language: dto.language || 'en',
          duration: dto.duration || 0,
          requirements: dto.requirements || [],
          learningGoals: dto.learningGoals || [],
          tags: dto.tags || [],
          seoTitle: dto.seoTitle,
          seoDescription: dto.seoDescription,
          seoKeywords: dto.seoKeywords || [],
          certificateEligible: dto.certificateEligible || false,
          status: dto.status || 'DRAFT',
          instructorId: userId,
        },
      });

      for (const topicDto of dto.topics || []) {
        const topic = await tx.topic.create({
          data: {
            title: topicDto.title,
            description: topicDto.description,
            courseId: newCourse.id,
            sortOrder: topicDto.sortOrder || 0,
          },
        });

        for (const subtopicDto of topicDto.subtopics || []) {
          const subtopic = await tx.subtopic.create({
            data: {
              title: subtopicDto.title,
              description: subtopicDto.description,
              topicId: topic.id,
              summary: subtopicDto.summary,
              keyTakeaways: subtopicDto.keyTakeaways || [],
              nextSubtopicId: subtopicDto.nextSubtopicId,
              sortOrder: subtopicDto.sortOrder || 0,
            },
          });

          for (const lessonDto of subtopicDto.lessons || []) {
            const lesson = await tx.lesson.create({
              data: {
                title: lessonDto.title,
                slug: generateSlug(lessonDto.slug),
                type: lessonDto.type,
                content: lessonDto.content,
                videoUrl: lessonDto.videoUrl,
                videoDuration: lessonDto.videoDuration,
                isFree: lessonDto.isFree || false,
                summary: lessonDto.summary,
                keyTakeaways: lessonDto.keyTakeaways || [],
                nextLessonId: lessonDto.nextLessonId,
                subtopicId: subtopic.id,
                sortOrder: lessonDto.sortOrder || 0,
              },
            });

            for (const blockDto of lessonDto.contentBlocks || []) {
              await tx.contentBlock.create({
                data: {
                  type: blockDto.type,
                  title: blockDto.title,
                  content: blockDto.content as Prisma.InputJsonValue,
                  lessonId: lesson.id,
                  sortOrder: blockDto.sortOrder || 0,
                },
              });
            }

            // Create quizzes if provided
            for (const quizDto of lessonDto.quizzes || []) {
              const quiz = await tx.quiz.create({
                data: {
                  title: quizDto.title,
                  description: quizDto.description,
                  passingScore: quizDto.passingScore || 70,
                  timeLimit: quizDto.timeLimit,
                  lessonId: lesson.id,
                },
              });

              for (const questionDto of quizDto.questions || []) {
                await tx.question.create({
                  data: {
                    text: questionDto.question,
                    type: questionDto.type as any,
                    options: questionDto.options as Prisma.InputJsonValue,
                    correctAnswer: questionDto.correctAnswer,
                    explanation: questionDto.explanation,
                    points: questionDto.points || 1,
                    quizId: quiz.id,
                  },
                });
              }
            }

            // Create exercises if provided
            for (const exerciseDto of lessonDto.exercises || []) {
              await tx.exercise.create({
                data: {
                  title: exerciseDto.title,
                  description: exerciseDto.description,
                  hints: exerciseDto.hints || [],
                  solution: exerciseDto.solution,
                  fileUrl: exerciseDto.fileUrl,
                  lessonId: lesson.id,
                },
              });
            }
          }
        }
      }

      return newCourse;
    });

    return this.getCourseStructure(course.id, userId, userRoles);
  }

  async updateCourseWithStructure(courseId: string, userId: string, userRoles: string[], dto: UpdateCourseWithStructureDto) {
    const course = await this.permissions.getCourseOrThrow(courseId);
    this.permissions.assert(userId, userRoles, course, 'edit_content');

    await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.CourseUpdateInput = {};
      if (dto.title) {
        updateData.title = dto.title;
        updateData.slug = generateSlug(dto.title);
      }
      if (dto.description) updateData.description = dto.description;
      if (dto.subtitle !== undefined) updateData.subtitle = dto.subtitle;
      if (dto.shortDescription !== undefined) updateData.shortDescription = dto.shortDescription;
      if (dto.thumbnail !== undefined) updateData.thumbnail = dto.thumbnail;
      if (dto.coverImage !== undefined) updateData.coverImage = dto.coverImage;
      if (dto.previewVideo !== undefined) updateData.previewVideo = dto.previewVideo;
      if (dto.promotionalVideo !== undefined) updateData.promotionalVideo = dto.promotionalVideo;
      if (dto.price !== undefined) updateData.price = new Prisma.Decimal(dto.price);
      if (dto.discountPrice !== undefined) updateData.discountPrice = new Prisma.Decimal(dto.discountPrice);
      if (dto.difficulty) updateData.difficulty = dto.difficulty;
      if (dto.categoryId) updateData.category = { connect: { id: dto.categoryId } };
      if (dto.language) updateData.language = dto.language;
      if (dto.duration !== undefined) updateData.duration = dto.duration;
      if (dto.requirements !== undefined) updateData.requirements = dto.requirements;
      if (dto.learningGoals !== undefined) updateData.learningGoals = dto.learningGoals;
      if (dto.tags !== undefined) updateData.tags = dto.tags;
      if (dto.seoTitle !== undefined) updateData.seoTitle = dto.seoTitle;
      if (dto.seoDescription !== undefined) updateData.seoDescription = dto.seoDescription;
      if (dto.seoKeywords !== undefined) updateData.seoKeywords = dto.seoKeywords;
      if (dto.certificateEligible !== undefined) updateData.certificateEligible = dto.certificateEligible;
      if (dto.status) updateData.status = dto.status;

      await tx.course.update({ where: { id: courseId }, data: updateData });

      if (dto.topics) {
        // Delete existing structure
        await tx.contentBlock.deleteMany({
          where: {
            lesson: {
              subtopic: {
                topic: { courseId },
              },
            },
          },
        });
        await tx.question.deleteMany({
          where: {
            quiz: {
              lesson: {
                subtopic: {
                  topic: { courseId },
                },
              },
            },
          },
        });
        await tx.quiz.deleteMany({
          where: {
            lesson: {
              subtopic: {
                topic: { courseId },
              },
            },
          },
        });
        await tx.exercise.deleteMany({
          where: {
            lesson: {
              subtopic: {
                topic: { courseId },
              },
            },
          },
        });
        await tx.lesson.deleteMany({
          where: {
            subtopic: {
              topic: { courseId },
            },
          },
        });
        await tx.subtopic.deleteMany({
          where: {
            topic: { courseId },
          },
        });
        await tx.topic.deleteMany({ where: { courseId } });

        // Create new structure
        for (const topicDto of dto.topics) {
          const topic = await tx.topic.create({
            data: {
              title: topicDto.title,
              description: topicDto.description,
              courseId: course.id,
              sortOrder: topicDto.sortOrder || 0,
            },
          });

          for (const subtopicDto of topicDto.subtopics || []) {
            const subtopic = await tx.subtopic.create({
              data: {
                title: subtopicDto.title,
                description: subtopicDto.description,
                topicId: topic.id,
                summary: subtopicDto.summary,
                keyTakeaways: subtopicDto.keyTakeaways || [],
                nextSubtopicId: subtopicDto.nextSubtopicId,
                sortOrder: subtopicDto.sortOrder || 0,
              },
            });

            for (const lessonDto of subtopicDto.lessons || []) {
              const lesson = await tx.lesson.create({
                data: {
                  title: lessonDto.title,
                  slug: generateSlug(lessonDto.slug),
                  type: lessonDto.type,
                  content: lessonDto.content,
                  videoUrl: lessonDto.videoUrl,
                  videoDuration: lessonDto.videoDuration,
                  isFree: lessonDto.isFree || false,
                  summary: lessonDto.summary,
                  keyTakeaways: lessonDto.keyTakeaways || [],
                  nextLessonId: lessonDto.nextLessonId,
                  subtopicId: subtopic.id,
                  sortOrder: lessonDto.sortOrder || 0,
                },
              });

              for (const blockDto of lessonDto.contentBlocks || []) {
                await tx.contentBlock.create({
                  data: {
                    type: blockDto.type,
                    title: blockDto.title,
                    content: blockDto.content as Prisma.InputJsonValue,
                    lessonId: lesson.id,
                    sortOrder: blockDto.sortOrder || 0,
                  },
                });
              }

              // Create quizzes if provided
              for (const quizDto of lessonDto.quizzes || []) {
                const quiz = await tx.quiz.create({
                  data: {
                    title: quizDto.title,
                    description: quizDto.description,
                    passingScore: quizDto.passingScore || 70,
                    timeLimit: quizDto.timeLimit,
                    lessonId: lesson.id,
                  },
                });

                for (const questionDto of quizDto.questions || []) {
                  await tx.question.create({
                    data: {
                      text: questionDto.question,
                      type: questionDto.type as any,
                      options: questionDto.options as Prisma.InputJsonValue,
                      correctAnswer: questionDto.correctAnswer,
                      explanation: questionDto.explanation,
                      points: questionDto.points || 1,
                      quizId: quiz.id,
                    },
                  });
                }
              }

              // Create exercises if provided
              for (const exerciseDto of lessonDto.exercises || []) {
                await tx.exercise.create({
                  data: {
                    title: exerciseDto.title,
                    description: exerciseDto.description,
                    hints: exerciseDto.hints || [],
                    solution: exerciseDto.solution,
                    fileUrl: exerciseDto.fileUrl,
                    lessonId: lesson.id,
                  },
                });
              }
            }
          }
        }
      }
    });

    return this.getCourseStructure(courseId, userId, userRoles);
  }

  async validateCourseForPublishing(courseId: string, userId: string, userRoles: string[]) {
    const course = await this.permissions.getCourseOrThrow(courseId);
    this.permissions.assert(userId, userRoles, course, 'read');

    const courseWithStructure = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        topics: {
          where: { deletedAt: null },
          include: {
            subtopics: {
              where: { deletedAt: null },
              include: {
                lessons: {
                  where: { deletedAt: null },
                  include: {
                    quizzes: true,
                    exercises: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!courseWithStructure) throw new NotFoundException('Course not found');

    const errors: string[] = [];

    if (!courseWithStructure.title) errors.push('Course title is required');
    if (!courseWithStructure.description) errors.push('Course description is required');
    if (!courseWithStructure.categoryId) errors.push('Course category is required');
    if (!courseWithStructure.thumbnail) errors.push('Course thumbnail is required');
    if (!courseWithStructure.learningGoals || courseWithStructure.learningGoals.length === 0) {
      errors.push('At least one learning goal is required');
    }

    const topicCount = courseWithStructure.topics.length;
    if (topicCount === 0) errors.push('At least one topic is required');

    let subtopicCount = 0;
    let lessonCount = 0;

    for (const topic of courseWithStructure.topics) {
      subtopicCount += topic.subtopics.length;
      for (const subtopic of topic.subtopics) {
        lessonCount += subtopic.lessons.length;
      }
    }

    if (subtopicCount === 0) errors.push('At least one subtopic is required');
    if (lessonCount === 0) errors.push('At least one lesson is required');

    let quizCount = 0;
    let exerciseCount = 0;

    for (const topic of courseWithStructure.topics) {
      for (const subtopic of topic.subtopics) {
        for (const lesson of subtopic.lessons) {
          quizCount += lesson.quizzes?.length || 0;
          exerciseCount += lesson.exercises?.length || 0;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      stats: {
        topics: topicCount,
        subtopics: subtopicCount,
        lessons: lessonCount,
        quizzes: quizCount,
        exercises: exerciseCount,
      },
    };
  }
}
