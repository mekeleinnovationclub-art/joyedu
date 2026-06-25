import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WithdrawalStatus } from '@prisma/client';

export interface UpdateBalanceData {
  userId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  reason?: string;
}

export interface CreateWithdrawalData {
  userId: string;
  amount: number;
  phoneNumber: string;
  reason?: string;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  // User Balance Management
  async getUserBalance(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return Number(user.walletBalance);
  }

  async updateUserBalance(data: UpdateBalanceData): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { walletBalance: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentBalance = Number(user.walletBalance);

    if (data.type === 'DEBIT' && currentBalance < data.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const newBalance = data.type === 'CREDIT' 
      ? currentBalance + data.amount 
      : currentBalance - data.amount;

    await this.prisma.user.update({
      where: { id: data.userId },
      data: { walletBalance: newBalance },
    });

    this.logger.log(
      `${data.type} ${data.amount} ETB to user ${data.userId}. ` +
      `Reason: ${data.reason || 'N/A'}. New balance: ${newBalance} ETB`
    );

    return newBalance;
  }

  async transferBalance(
    fromUserId: string,
    toUserId: string,
    amount: number,
    reason: string
  ): Promise<boolean> {
    return await this.prisma.$transaction(async (tx) => {
      // Check from user balance
      const fromUser = await tx.user.findUnique({
        where: { id: fromUserId },
        select: { walletBalance: true },
      });

      if (!fromUser) {
        throw new NotFoundException('Sender user not found');
      }

      if (Number(fromUser.walletBalance) < amount) {
        throw new BadRequestException('Insufficient balance for transfer');
      }

      // Check to user exists
      const toUser = await tx.user.findUnique({
        where: { id: toUserId },
      });

      if (!toUser) {
        throw new NotFoundException('Recipient user not found');
      }

      // Debit from sender
      await tx.user.update({
        where: { id: fromUserId },
        data: {
          walletBalance: {
            decrement: amount,
          },
        },
      });

      // Credit to recipient
      await tx.user.update({
        where: { id: toUserId },
        data: {
          walletBalance: {
            increment: amount,
          },
        },
      });

      this.logger.log(
        `Transferred ${amount} ETB from ${fromUserId} to ${toUserId}. Reason: ${reason}`
      );

      return true;
    });
  }

  // Withdrawal Management
  async createWithdrawal(data: CreateWithdrawalData) {
    return await this.prisma.$transaction(async (tx) => {
      // Check user balance
      const user = await tx.user.findUnique({
        where: { id: data.userId },
        select: { walletBalance: true, phoneNumber: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (Number(user.walletBalance) < data.amount) {
        throw new BadRequestException('Insufficient wallet balance for withdrawal');
      }

      // Ensure we have a valid phone number
      const phoneNumber = data.phoneNumber || user.phoneNumber;
      if (!phoneNumber) {
        throw new BadRequestException('Phone number is required for withdrawal');
      }

      // Deduct from user balance
      await tx.user.update({
        where: { id: data.userId },
        data: {
          walletBalance: {
            decrement: data.amount,
          },
        },
      });

      // Create withdrawal record
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: data.userId,
          amount: data.amount,
          phoneNumber,
          reason: data.reason,
          status: WithdrawalStatus.PENDING,
        },
      });

      this.logger.log(
        `Created withdrawal ${withdrawal.id} for user ${data.userId}, amount: ${data.amount} ETB`
      );

      return withdrawal;
    });
  }

  async updateWithdrawalStatus(
    withdrawalId: string,
    status: WithdrawalStatus,
    transId?: string
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: { id: withdrawalId },
      });

      if (!withdrawal) {
        throw new NotFoundException('Withdrawal not found');
      }

      const oldStatus = withdrawal.status;
      const updateData: any = {
        status,
      };

      if (transId) {
        updateData.transId = transId;
      }

      if (status === WithdrawalStatus.COMPLETED) {
        updateData.completedAt = new Date();
      } else if (status === WithdrawalStatus.FAILED && oldStatus === WithdrawalStatus.PENDING) {
        // Refund the amount back to user balance if withdrawal failed
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: {
            walletBalance: {
              increment: Number(withdrawal.amount),
            },
          },
        });
      }

      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: updateData,
      });

      this.logger.log(
        `Updated withdrawal ${withdrawalId} status from ${oldStatus} to ${status}`
      );

      return updatedWithdrawal;
    });
  }

  async getUserWithdrawals(userId: string) {
    return await this.prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWithdrawal(withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    return withdrawal;
  }

  // Transaction Management for Wallet Operations
  async createTopupTransaction(
    userId: string,
    amount: number,
    merchantOrderId: string,
    title: string
  ) {
    return await this.prisma.transaction.create({
      data: {
        userId,
        amount,
        currency: 'ETB',
        status: 'PENDING',
        paymentMethod: 'TELEBIRR',
        telebirrOrderId: merchantOrderId,
        description: title,
      },
    });
  }

  async createPaymentTransaction(
    userId: string,
    courseId: string,
    amount: number,
    description: string
  ) {
    return await this.prisma.transaction.create({
      data: {
        userId,
        courseId,
        amount,
        currency: 'ETB',
        status: 'COMPLETED',
        paymentMethod: 'WALLET',
        description,
      },
    });
  }
}
