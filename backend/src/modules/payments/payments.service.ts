import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { FundEscrowDto, SetupPayoutDto } from './dto';
import { TransactionType, TransactionStatus, EscrowStatus, MilestoneStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async fundEscrow(userId: string, dto: FundEscrowDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
      include: { escrow: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.clientId !== userId) {
      throw new ForbiddenException('Only the client can fund escrow');
    }

    if (!contract.escrow) {
      throw new BadRequestException('Escrow not found for this contract');
    }

    if (contract.escrow.status !== EscrowStatus.PENDING) {
      throw new BadRequestException('Escrow already funded');
    }

    // In production, this would integrate with Stripe/Razorpay
    // For now, simulate the payment

    const platformFee = contract.totalAmount.toNumber() * 0.1; // 10% platform fee
    const netAmount = contract.totalAmount.toNumber() - platformFee;

    // Create transaction record
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        escrowId: contract.escrow.id,
        type: TransactionType.ESCROW_FUND,
        amount: contract.totalAmount,
        fee: platformFee,
        netAmount,
        status: TransactionStatus.COMPLETED,
        paymentMethod: dto.paymentMethod,
        description: `Escrow funding for contract: ${contract.title}`,
      },
    });

    // Update escrow status
    await this.prisma.escrow.update({
      where: { id: contract.escrow.id },
      data: {
        status: EscrowStatus.FUNDED,
        heldAmount: contract.totalAmount,
        fundedAt: new Date(),
      },
    });

    return {
      transaction,
      message: 'Escrow funded successfully',
    };
  }

  async releaseMilestonePayment(userId: string, contractId: string, milestoneId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { escrow: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.clientId !== userId) {
      throw new ForbiddenException('Only the client can release payments');
    }

    const milestone = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contractId },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    if (milestone.status !== MilestoneStatus.APPROVED) {
      throw new BadRequestException('Milestone must be approved before payment release');
    }

    const platformFee = milestone.amount.toNumber() * 0.1;
    const netAmount = milestone.amount.toNumber() - platformFee;

    // Create release transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        userId: contract.freelancerId,
        escrowId: contract.escrow!.id,
        milestoneId,
        type: TransactionType.ESCROW_RELEASE,
        amount: milestone.amount,
        fee: platformFee,
        netAmount,
        status: TransactionStatus.COMPLETED,
        description: `Payment for milestone: ${milestone.title}`,
      },
    });

    // Update milestone status
    await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: MilestoneStatus.PAID },
    });

    // Update escrow amounts
    await this.prisma.escrow.update({
      where: { id: contract.escrow!.id },
      data: {
        heldAmount: { decrement: milestone.amount },
        releasedAmount: { increment: milestone.amount },
        status: contract.escrow!.heldAmount.toNumber() <= milestone.amount.toNumber()
          ? EscrowStatus.RELEASED
          : EscrowStatus.PARTIALLY_RELEASED,
      },
    });

    return {
      transaction,
      message: 'Payment released successfully',
    };
  }

  async getTransactionHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        include: {
          escrow: {
            include: {
              contract: {
                select: { title: true, id: true },
              },
            },
          },
          milestone: true,
          invoice: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEarnings(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    const pendingEarnings = await this.prisma.escrow.aggregate({
      where: {
        contract: { freelancerId: userId },
        status: { in: [EscrowStatus.FUNDED, EscrowStatus.PARTIALLY_RELEASED] },
      },
      _sum: { heldAmount: true },
    });

    const thisMonthEarnings = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.ESCROW_RELEASE,
        status: TransactionStatus.COMPLETED,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { netAmount: true },
    });

    return {
      totalEarnings: profile?.totalEarnings || 0,
      pendingEarnings: pendingEarnings._sum.heldAmount || 0,
      thisMonthEarnings: thisMonthEarnings._sum.netAmount || 0,
    };
  }

  async setupPayout(userId: string, dto: SetupPayoutDto) {
    const existingSettings = await this.prisma.payoutSettings.findUnique({
      where: { userId },
    });

    if (existingSettings) {
      return this.prisma.payoutSettings.update({
        where: { userId },
        data: {
          payoutMethod: dto.payoutMethod,
          bankAccountInfo: dto.bankAccountInfo,
        },
      });
    }

    return this.prisma.payoutSettings.create({
      data: {
        userId,
        payoutMethod: dto.payoutMethod,
        bankAccountInfo: dto.bankAccountInfo,
      },
    });
  }

  async getPayoutSettings(userId: string) {
    return this.prisma.payoutSettings.findUnique({
      where: { userId },
    });
  }

  async requestPayout(userId: string, amount: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile || profile.totalEarnings.toNumber() < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const payoutSettings = await this.prisma.payoutSettings.findUnique({
      where: { userId },
    });

    if (!payoutSettings || !payoutSettings.isVerified) {
      throw new BadRequestException('Please set up and verify your payout settings first');
    }

    // Create payout transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.PAYOUT,
        amount,
        fee: 0,
        netAmount: amount,
        status: TransactionStatus.PROCESSING,
        paymentMethod: payoutSettings.payoutMethod,
        description: 'Payout request',
      },
    });

    return {
      transaction,
      message: 'Payout request submitted',
    };
  }
}
