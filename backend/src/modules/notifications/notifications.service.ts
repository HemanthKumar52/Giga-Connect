import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
      },
    });
  }

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(userId: string, notificationId: string) {
    await this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });

    return { message: 'Notification deleted' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { unreadCount: count };
  }

  // Helper methods for creating specific notifications
  async notifyNewProposal(employerId: string, jobTitle: string, freelancerName: string) {
    return this.createNotification(
      employerId,
      NotificationType.NEW_PROPOSAL,
      'New Proposal',
      `${freelancerName} submitted a proposal for "${jobTitle}"`,
    );
  }

  async notifyProposalAccepted(freelancerId: string, jobTitle: string) {
    return this.createNotification(
      freelancerId,
      NotificationType.PROPOSAL_ACCEPTED,
      'Proposal Accepted',
      `Your proposal for "${jobTitle}" has been accepted!`,
    );
  }

  async notifyNewMessage(userId: string, senderName: string) {
    return this.createNotification(
      userId,
      NotificationType.NEW_MESSAGE,
      'New Message',
      `${senderName} sent you a message`,
    );
  }

  async notifyPaymentReceived(userId: string, amount: number, projectTitle: string) {
    return this.createNotification(
      userId,
      NotificationType.PAYMENT_RECEIVED,
      'Payment Received',
      `You received $${amount} for "${projectTitle}"`,
    );
  }

  async notifyReviewReceived(userId: string, rating: number, reviewerName: string) {
    return this.createNotification(
      userId,
      NotificationType.REVIEW_RECEIVED,
      'New Review',
      `${reviewerName} left you a ${rating}-star review`,
    );
  }
}
