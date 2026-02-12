import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalFreelancers,
      totalEmployers,
      totalJobs,
      activeJobs,
      totalContracts,
      activeContracts,
      totalTransactions,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: { in: ['FREELANCER', 'HYBRID'] } } }),
      this.prisma.user.count({ where: { role: { in: ['EMPLOYER', 'HYBRID'] } } }),
      this.prisma.job.count(),
      this.prisma.job.count({ where: { status: 'OPEN' } }),
      this.prisma.contract.count(),
      this.prisma.contract.count({ where: { status: 'ACTIVE' } }),
      this.prisma.transaction.count({ where: { status: 'COMPLETED' } }),
      this.prisma.transaction.aggregate({
        where: { type: 'FEE', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        freelancers: totalFreelancers,
        employers: totalEmployers,
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
      },
      contracts: {
        total: totalContracts,
        active: activeContracts,
      },
      revenue: {
        totalTransactions,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
    };
  }

  async getUsers(page = 1, limit = 20, status?: UserStatus, role?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          profile: true,
          _count: {
            select: {
              postedJobs: true,
              proposals: true,
              reviewsReceived: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => {
        const { password, mfaSecret, ...rest } = u;
        return rest;
      }),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async suspendUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    });

    return { message: 'User suspended' };
  }

  async activateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });

    return { message: 'User activated' };
  }

  async getDisputes(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where: { status: 'DISPUTED' },
        include: {
          client: { include: { profile: true } },
          freelancer: { include: { profile: true } },
          job: true,
          escrow: true,
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.contract.count({ where: { status: 'DISPUTED' } }),
    ]);

    return {
      data: contracts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRecentTransactions(limit = 50) {
    return this.prisma.transaction.findMany({
      include: {
        user: { include: { profile: true } },
        escrow: {
          include: {
            contract: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getFraudAlerts(limit = 20) {
    // Get users with high fraud scores
    const suspiciousUsers = await this.prisma.profile.findMany({
      where: { fraudScore: { gte: 0.7 } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { fraudScore: 'desc' },
      take: limit,
    });

    return suspiciousUsers;
  }

  async getSystemHealth() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      newUsersToday,
      newJobsToday,
      activeUsersToday,
      messagestoday,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
      this.prisma.job.count({ where: { createdAt: { gte: oneDayAgo } } }),
      this.prisma.user.count({ where: { lastLoginAt: { gte: oneDayAgo } } }),
      this.prisma.message.count({ where: { createdAt: { gte: oneDayAgo } } }),
    ]);

    return {
      last24Hours: {
        newUsers: newUsersToday,
        newJobs: newJobsToday,
        activeUsers: activeUsersToday,
        messages: messagestoday,
      },
      status: 'healthy',
    };
  }
}
