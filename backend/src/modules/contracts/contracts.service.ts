import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitDeliverableDto, AddTimeEntryDto, CreateReviewDto } from './dto';
import { ContractStatus, MilestoneStatus, JobStatus } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        job: { include: { skills: { include: { skill: true } } } },
        client: { include: { profile: true } },
        freelancer: { include: { profile: true } },
        milestones: { orderBy: { order: 'asc' } },
        escrow: true,
        deliverables: { orderBy: { submittedAt: 'desc' } },
        timeEntries: { orderBy: { date: 'desc' } },
        reviews: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return contract;
  }

  async getMyContracts(userId: string, role: 'client' | 'freelancer', status?: ContractStatus) {
    const whereClause = role === 'client'
      ? { clientId: userId }
      : { freelancerId: userId };

    return this.prisma.contract.findMany({
      where: {
        ...whereClause,
        ...(status && { status }),
      },
      include: {
        job: true,
        client: { include: { profile: true } },
        freelancer: { include: { profile: true } },
        milestones: true,
        escrow: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async startMilestone(contractId: string, milestoneId: string, userId: string) {
    const contract = await this.validateContractAccess(contractId, userId, 'freelancer');

    const milestone = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contractId },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    if (milestone.status !== MilestoneStatus.PENDING) {
      throw new BadRequestException('Milestone already started or completed');
    }

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: MilestoneStatus.IN_PROGRESS },
    });
  }

  async submitMilestone(contractId: string, milestoneId: string, userId: string, dto: SubmitDeliverableDto) {
    const contract = await this.validateContractAccess(contractId, userId, 'freelancer');

    const milestone = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contractId },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    if (milestone.status === MilestoneStatus.APPROVED || milestone.status === MilestoneStatus.PAID) {
      throw new BadRequestException('Milestone already completed');
    }

    // Create deliverable
    await this.prisma.deliverable.create({
      data: {
        contractId,
        milestoneId,
        title: dto.title,
        description: dto.description,
        fileUrls: dto.fileUrls || [],
      },
    });

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: MilestoneStatus.SUBMITTED,
        completedAt: new Date(),
      },
      include: { deliverables: true },
    });
  }

  async approveMilestone(contractId: string, milestoneId: string, userId: string) {
    const contract = await this.validateContractAccess(contractId, userId, 'client');

    const milestone = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contractId },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    if (milestone.status !== MilestoneStatus.SUBMITTED) {
      throw new BadRequestException('Milestone not submitted for review');
    }

    // Update milestone
    const updatedMilestone = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: MilestoneStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    // Update contract paid amount
    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        paidAmount: { increment: milestone.amount },
      },
    });

    // Check if all milestones are completed
    const remainingMilestones = await this.prisma.milestone.count({
      where: {
        contractId,
        status: { notIn: [MilestoneStatus.APPROVED, MilestoneStatus.PAID] },
      },
    });

    if (remainingMilestones === 0) {
      await this.completeContract(contractId);
    }

    return updatedMilestone;
  }

  async requestRevision(contractId: string, milestoneId: string, userId: string, feedback: string) {
    const contract = await this.validateContractAccess(contractId, userId, 'client');

    const milestone = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contractId },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    if (milestone.status !== MilestoneStatus.SUBMITTED) {
      throw new BadRequestException('Milestone not submitted for review');
    }

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: MilestoneStatus.REVISION_REQUESTED },
    });
  }

  async addTimeEntry(contractId: string, userId: string, dto: AddTimeEntryDto) {
    const contract = await this.validateContractAccess(contractId, userId, 'freelancer');

    if (contract.contractType !== 'HOURLY') {
      throw new BadRequestException('Time entries only for hourly contracts');
    }

    return this.prisma.timeEntry.create({
      data: {
        contractId,
        description: dto.description,
        hours: dto.hours,
        date: new Date(dto.date),
      },
    });
  }

  async getTimeEntries(contractId: string, userId: string) {
    await this.validateContractAccess(contractId, userId);

    return this.prisma.timeEntry.findMany({
      where: { contractId },
      orderBy: { date: 'desc' },
    });
  }

  async submitReview(contractId: string, userId: string, dto: CreateReviewDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (contract.status !== ContractStatus.COMPLETED) {
      throw new BadRequestException('Contract must be completed to leave a review');
    }

    const targetId = contract.clientId === userId ? contract.freelancerId : contract.clientId;

    const existingReview = await this.prisma.review.findUnique({
      where: {
        contractId_authorId: {
          contractId,
          authorId: userId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already submitted a review');
    }

    const review = await this.prisma.review.create({
      data: {
        contractId,
        authorId: userId,
        targetId,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
      },
    });

    // Update target user's average rating
    await this.updateUserRating(targetId);

    return review;
  }

  private async completeContract(contractId: string) {
    const contract = await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    // Update job status
    await this.prisma.job.update({
      where: { id: contract.jobId },
      data: { status: JobStatus.COMPLETED },
    });

    // Update freelancer stats
    await this.prisma.profile.update({
      where: { userId: contract.freelancerId },
      data: {
        completedJobs: { increment: 1 },
        totalEarnings: { increment: contract.totalAmount },
      },
    });

    // Update client stats
    await this.prisma.profile.update({
      where: { userId: contract.clientId },
      data: {
        totalSpent: { increment: contract.totalAmount },
      },
    });

    return contract;
  }

  private async updateUserRating(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { targetId: userId },
    });

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await this.prisma.profile.update({
        where: { userId },
        data: {
          avgRating,
          totalReviews: reviews.length,
        },
      });
    }
  }

  private async validateContractAccess(contractId: string, userId: string, role?: 'client' | 'freelancer') {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (role === 'client' && contract.clientId !== userId) {
      throw new ForbiddenException('Only the client can perform this action');
    }

    if (role === 'freelancer' && contract.freelancerId !== userId) {
      throw new ForbiddenException('Only the freelancer can perform this action');
    }

    if (!role && contract.clientId !== userId && contract.freelancerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return contract;
  }
}
