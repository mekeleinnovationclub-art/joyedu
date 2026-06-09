import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateChatDto, SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createChat(userId: string, dto: CreateChatDto) {
    const allMembers = [userId, ...dto.memberIds.filter((id) => id !== userId)];
    return this.prisma.chat.create({
      data: {
        name: dto.name,
        isGroup: allMembers.length > 2,
        members: {
          create: allMembers.map((id) => ({ userId: id })),
        },
      },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
      },
    });
  }

  async getUserChats(userId: string) {
    return this.prisma.chat.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getInstructorConversations(instructorId: string) {
    const courses = await this.prisma.course.findMany({
      where: { instructorId, deletedAt: null },
      select: { id: true },
    });

    const courseIds = courses.map((c) => c.id);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: { in: courseIds } },
      select: { userId: true },
      distinct: ['userId'],
    });

    const studentIds = enrollments.map((e) => e.userId);

    const chats = await this.prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId: { in: studentIds },
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return chats;
  }

  async getChatMessages(chatId: string, userId: string, page = 1, limit = 50) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member');

    const skip = (page - 1) * limit;
    return this.prisma.message.findMany({
      where: { chatId, deletedAt: null },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });
  }

  async sendMessage(userId: string, dto: SendMessageDto) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: dto.chatId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member');

    const message = await this.prisma.message.create({
      data: { chatId: dto.chatId, senderId: userId, content: dto.content },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    await this.prisma.chat.update({
      where: { id: dto.chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Not your message');

    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }
}
