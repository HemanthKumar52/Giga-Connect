import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProposalDto, UpdateProposalDto } from './dto';
import { ProposalStatus, JobStatus, ContractType } from '@prisma/client';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  async create(freelancerId: string, dto: CreateProposalDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Job is not accepting proposals');
    }

    if (job.posterId === freelancerId) {
      throw new BadRequestException('You cannot submit a proposal to your own job');
    }

    const existingProposal = await this.prisma.proposal.findUnique({
      where: {
        jobId_freelancerId: {
          jobId: dto.jobId,
          freelancerId,
        },
      },
    });

    if (existingProposal) {
      throw new BadRequestException('You have already submitted a proposal for this job');
    }

    const proposal = await this.prisma.proposal.create({
      data: {
        jobId: dto.jobId,
        freelancerId,
        coverLetter: dto.coverLetter,
        bidAmount: dto.bidAmount,
        estimatedDuration: dto.estimatedDuration,
        attachments: dto.attachments || [],
        milestones: {
          create: dto.milestones?.map((m, index) => ({
            title: m.title,
            description: m.description,
            amount: m.amount,
            duration: m.duration,
            order: index,
          })),
        },
      },
      include: {
        freelancer: { include: { profile: true } },
        job: true,
        milestones: { orderBy: { order: 'asc' } },
      },
    });

    // Increment proposal count on job
    await this.prisma.job.update({
      where: { id: dto.jobId },
      data: { proposalCount: { increment: 1 } },
    });

    return proposal;
  }

  async findById(id: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: {
        freelancer: {
          include: {
            profile: true,
            skills: { include: { skill: true } },
          },
        },
        job: {
          include: {
            poster: { include: { profile: true } },
          },
        },
        milestones: { orderBy: { order: 'asc' } },
        contract: true,
      },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return proposal;
  }

  async update(proposalId: string, freelancerId: string, dto: UpdateProposalDto) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.freelancerId !== freelancerId) {
      throw new ForbiddenException('You can only edit your own proposals');
    }

    if (proposal.status !== ProposalStatus.PENDING) {
      throw new BadRequestException('Cannot edit proposal that is not pending');
    }

    // Delete existing milestones if updating
    if (dto.milestones) {
      await this.prisma.proposedMilestone.deleteMany({
        where: { proposalId },
      });
    }

    return this.prisma.proposal.update({
      where: { id: proposalId },
      data: {
        coverLetter: dto.coverLetter,
        bidAmount: dto.bidAmount,
        estimatedDuration: dto.estimatedDuration,
        attachments: dto.attachments,
        ...(dto.milestones && {
          milestones: {
            create: dto.milestones.map((m, index) => ({
              title: m.title,
              description: m.description,
              amount: m.amount,
              duration: m.duration,
              order: index,
            })),
          },
        }),
      },
      include: {
        freelancer: { include: { profile: true } },
        milestones: { orderBy: { order: 'asc' } },
      },
    });
  }

  async withdraw(proposalId: string, freelancerId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.freelancerId !== freelancerId) {
      throw new ForbiddenException('You can only withdraw your own proposals');
    }

    if (proposal.status !== ProposalStatus.PENDING && proposal.status !== ProposalStatus.SHORTLISTED) {
      throw new BadRequestException('Cannot withdraw proposal at this stage');
    }

    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.WITHDRAWN },
    });

    // Decrement proposal count on job
    await this.prisma.job.update({
      where: { id: proposal.jobId },
      data: { proposalCount: { decrement: 1 } },
    });

    return { message: 'Proposal withdrawn' };
  }

  async getJobProposals(jobId: string, posterId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.posterId !== posterId) {
      throw new ForbiddenException('You can only view proposals for your own jobs');
    }

    return this.prisma.proposal.findMany({
      where: { jobId },
      include: {
        freelancer: {
          include: {
            profile: true,
            skills: { include: { skill: true } },
          },
        },
        milestones: { orderBy: { order: 'asc' } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getMyProposals(freelancerId: string, status?: ProposalStatus) {
    return this.prisma.proposal.findMany({
      where: {
        freelancerId,
        ...(status && { status }),
      },
      include: {
        job: {
          include: {
            poster: { include: { profile: true } },
            skills: { include: { skill: true } },
          },
        },
        milestones: { orderBy: { order: 'asc' } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async shortlist(proposalId: string, posterId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { job: true },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.job.posterId !== posterId) {
      throw new ForbiddenException('You can only shortlist proposals for your own jobs');
    }

    return this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.SHORTLISTED },
    });
  }

  async reject(proposalId: string, posterId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { job: true },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.job.posterId !== posterId) {
      throw new ForbiddenException('You can only reject proposals for your own jobs');
    }

    return this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.REJECTED },
    });
  }

  async accept(proposalId: string, posterId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        job: true,
        milestones: { orderBy: { order: 'asc' } },
        freelancer: true,
      },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.job.posterId !== posterId) {
      throw new ForbiddenException('You can only accept proposals for your own jobs');
    }

    // Create contract from proposal
    const contract = await this.prisma.contract.create({
      data: {
        jobId: proposal.jobId,
        proposalId: proposal.id,
        clientId: posterId,
        freelancerId: proposal.freelancerId,
        title: proposal.job.title,
        description: proposal.job.description,
        totalAmount: proposal.bidAmount,
        contractType: this.mapJobTypeToContractType(proposal.job.jobType),
        milestones: {
          create: proposal.milestones.map((m) => ({
            title: m.title,
            description: m.description,
            amount: m.amount,
            dueDate: null,
            order: m.order,
          })),
        },
        escrow: {
          create: {
            totalAmount: proposal.bidAmount,
          },
        },
      },
      include: {
        milestones: true,
        escrow: true,
      },
    });

    // Update proposal status
    await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.ACCEPTED },
    });

    // Reject all other proposals
    await this.prisma.proposal.updateMany({
      where: {
        jobId: proposal.jobId,
        id: { not: proposalId },
        status: { in: [ProposalStatus.PENDING, ProposalStatus.SHORTLISTED] },
      },
      data: { status: ProposalStatus.REJECTED },
    });

    // Update job status
    await this.prisma.job.update({
      where: { id: proposal.jobId },
      data: { status: JobStatus.IN_PROGRESS },
    });

    return contract;
  }

  private mapJobTypeToContractType(jobType: string): ContractType {
    switch (jobType) {
      case 'HOURLY':
        return ContractType.HOURLY;
      case 'MILESTONE':
        return ContractType.MILESTONE;
      default:
        return ContractType.FIXED_PRICE;
    }
  }
}
