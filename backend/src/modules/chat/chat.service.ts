import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto, CreateConversationDto } from './dto';
import { ConversationType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    // For direct messages, check if conversation already exists
    if (dto.type === ConversationType.DIRECT && dto.participantIds.length === 1) {
      const existingConversation = await this.prisma.conversation.findFirst({
        where: {
          type: ConversationType.DIRECT,
          participants: {
            every: {
              userId: { in: [userId, dto.participantIds[0]] },
            },
          },
        },
        include: {
          participants: {
            include: {
              user: { include: { profile: true } },
            },
          },
        },
      });

      if (existingConversation) {
        return existingConversation;
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: dto.type || ConversationType.DIRECT,
        title: dto.title,
        contractId: dto.contractId,
        participants: {
          create: [
            { userId },
            ...dto.participantIds.map((id) => ({ userId: id })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });

    return conversation;
  }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: { include: { profile: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        contract: {
          select: { id: true, title: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: { include: { profile: true } },
          },
        },
        contract: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    return conversation;
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    await this.validateAccess(conversationId, userId);

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: { include: { profile: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    // Mark as read
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });

    return {
      data: messages.reverse(),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async sendMessage(conversationId: string, senderId: string, dto: CreateMessageDto) {
    await this.validateAccess(conversationId, senderId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: dto.content,
        messageType: dto.messageType || 'TEXT',
        attachments: dto.attachments || [],
      },
      include: {
        sender: { include: { profile: true } },
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async editMessage(messageId: string, userId: string, content: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
      },
      include: {
        sender: { include: { profile: true } },
      },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, content: '' },
    });

    return { message: 'Message deleted' };
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.validateAccess(conversationId, userId);

    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });

    return { message: 'Marked as read' };
  }

  async getUnreadCount(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          where: { userId },
        },
        messages: {
          where: {
            senderId: { not: userId },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    let unreadCount = 0;
    for (const conv of conversations) {
      const participant = conv.participants[0];
      const lastMessage = conv.messages[0];
      if (lastMessage && (!participant.lastReadAt || lastMessage.createdAt > participant.lastReadAt)) {
        unreadCount++;
      }
    }

    return { unreadCount };
  }

  private async validateAccess(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    return participant;
  }
}
