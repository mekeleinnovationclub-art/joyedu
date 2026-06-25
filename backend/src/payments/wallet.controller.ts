import { Controller, Post, Body, Get, Param, UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { TelebirrService } from './telebirr/telebirr.service';
import { B2CDisbursementService } from './telebirr/b2c-disbursement.service';
import { PrismaService } from '../common/prisma.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly telebirrService: TelebirrService,
    private readonly b2cDisbursementService: B2CDisbursementService,
    private readonly prisma: PrismaService,
  ) {}

  // Get user wallet balance
  @Get('balance')
  @ApiOperation({ summary: 'Get user wallet balance' })
  async getBalance(@CurrentUser() user: JwtPayload) {
    const balance = await this.walletService.getUserBalance(user.sub);
    return { balance, currency: 'ETB' };
  }

  // Wallet Topup - Create Telebirr order for wallet topup
  @Post('topup')
  @ApiOperation({ summary: 'Create Telebirr order for wallet topup' })
  async walletTopup(
    @CurrentUser() user: JwtPayload,
    @Body() body: { amount: number; title?: string }
  ) {
    try {
      const title = body.title || 'Wallet Topup';

      this.logger.log(`Wallet topup request - User: ${user.sub}, Amount: ${body.amount}, Title: ${title}`);
      this.logger.log(`Request body: ${JSON.stringify(body)}`);

      // Validate amount
      if (!body.amount || body.amount <= 0) {
        this.logger.warn(`Invalid amount: ${body.amount}`);
        throw new BadRequestException('Amount must be greater than 0');
      }

      // Create Telebirr order for wallet topup
      this.logger.log('Creating Telebirr order...');
      const { rawRequest, merchantOrderId } = await this.telebirrService.createOrder(
        user.sub,
        'WALLET_TOPUP',
        body.amount,
        title,
      );

      this.logger.log(`Telebirr order created - MerchantOrderId: ${merchantOrderId}`);

      // Create transaction record
      this.logger.log('Creating transaction record...');
      const transaction = await this.walletService.createTopupTransaction(
        user.sub,
        body.amount,
        merchantOrderId,
        title,
      );

      this.logger.log(`Transaction created - TransactionId: ${transaction.id}`);

      return {
        success: true,
        rawRequest,
        merchantOrderId,
        transactionId: transaction.id,
      };
    } catch (error) {
      this.logger.error('Wallet topup failed:', error);
      this.logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create wallet topup order. Please try again later.');
    }
  }

  // Wallet Withdrawal - Request withdrawal via B2C disbursement
  @Post('withdraw')
  @ApiOperation({ summary: 'Request wallet withdrawal via B2C disbursement' })
  async walletWithdraw(
    @CurrentUser() user: JwtPayload,
    @Body() body: { amount: number; phoneNumber: string; reason?: string }
  ) {
    this.logger.log(`Wallet withdrawal for user ${user.sub}, amount: ${body.amount} ETB`);

    // Create withdrawal record (deducts balance immediately)
    const withdrawal = await this.walletService.createWithdrawal({
      userId: user.sub,
      amount: body.amount,
      phoneNumber: body.phoneNumber,
      reason: body.reason,
    });

    // Get fabric token for B2C disbursement
    const fabricToken = await (this.telebirrService as any).applyFabricToken();

    // Initiate B2C disbursement
    const disbursementResponse = await this.b2cDisbursementService.disburse(
      body.phoneNumber,
      body.amount.toString(),
      user.email || 'User',
      fabricToken,
      body.reason,
    );

    // Update withdrawal status based on disbursement response
    if (disbursementResponse.result === 'SUCCESS') {
      await this.walletService.updateWithdrawalStatus(
        withdrawal.id,
        'COMPLETED',
        disbursementResponse.biz_content.trans_id,
      );
    } else {
      await this.walletService.updateWithdrawalStatus(withdrawal.id, 'FAILED');
    }

    return {
      success: disbursementResponse.result === 'SUCCESS',
      withdrawalId: withdrawal.id,
      transId: disbursementResponse.biz_content?.trans_id,
      status: disbursementResponse.result,
      newBalance: await this.walletService.getUserBalance(user.sub),
    };
  }

  // Wallet Payment - Pay for course using wallet balance
  @Post('pay')
  @ApiOperation({ summary: 'Pay for course using wallet balance' })
  async walletPay(
    @CurrentUser() user: JwtPayload,
    @Body() body: { courseId: string; amount: number; description?: string }
  ) {
    this.logger.log(`Wallet payment for user ${user.sub}, amount: ${body.amount} ETB`);

    // Deduct from user balance
    const newBalance = await this.walletService.updateUserBalance({
      userId: user.sub,
      amount: body.amount,
      type: 'DEBIT',
      reason: body.description || `Course payment for ${body.courseId}`,
    });

    // Create transaction record
    await this.walletService.createPaymentTransaction(
      user.sub,
      body.courseId,
      body.amount,
      body.description || 'Course payment via wallet',
    );

    return {
      success: true,
      newBalance,
      message: 'Payment successful',
    };
  }

  // Get user withdrawals
  @Get('withdrawals')
  @ApiOperation({ summary: 'Get user withdrawal history' })
  async getWithdrawals(@CurrentUser() user: JwtPayload) {
    const withdrawals = await this.walletService.getUserWithdrawals(user.sub);
    return { withdrawals };
  }

  // Get specific withdrawal
  @Get('withdrawals/:id')
  @ApiOperation({ summary: 'Get specific withdrawal details' })
  async getWithdrawal(@Param('id') id: string) {
    const withdrawal = await this.walletService.getWithdrawal(id);
    return { withdrawal };
  }

  // Transfer balance between users
  @Post('transfer')
  @ApiOperation({ summary: 'Transfer wallet balance to another user' })
  async transferBalance(
    @CurrentUser() user: JwtPayload,
    @Body() body: { toUserId: string; amount: number; reason: string }
  ) {
    this.logger.log(
      `Transferring ${body.amount} ETB from ${user.sub} to ${body.toUserId}`
    );

    const success = await this.walletService.transferBalance(
      user.sub,
      body.toUserId,
      body.amount,
      body.reason,
    );

    const newBalance = await this.walletService.getUserBalance(user.sub);

    return {
      success,
      newBalance,
    };
  }
}

@ApiTags('Admin Wallet')
@Controller('admin/wallet')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AdminWalletController {
  private readonly logger = new Logger(AdminWalletController.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get('stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get wallet system statistics' })
  async getWalletStats() {
    const [totalBalance, totalUsers, totalWithdrawals, totalTopups] = await Promise.all([
      this.prisma.user.aggregate({
        _sum: { walletBalance: true },
      }),
      this.prisma.user.count({
        where: { walletBalance: { gt: 0 } },
      }),
      this.prisma.withdrawal.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { 
          paymentMethod: 'WALLET',
          status: 'COMPLETED',
          description: { contains: 'Wallet topup' },
        },
      }),
    ]);

    return {
      totalBalance: Number(totalBalance._sum.walletBalance || 0),
      totalUsers,
      totalWithdrawals: Number(totalWithdrawals._sum.amount || 0),
      totalTopups: Number(totalTopups._sum.amount || 0),
    };
  }
}
