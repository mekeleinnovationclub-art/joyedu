import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../common/prisma.service';
import { CreateCheckoutDto } from './dto/payments.dto';
import { CreateTelebirrOrderDto, TelebirrWebhookDto, RefundTelebirrOrderDto } from './telebirr/dto/telebirr.dto';
import { TelebirrService } from './telebirr/telebirr.service';
import { WalletService } from './wallet.service';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private telebirrService: TelebirrService,
    private walletService: WalletService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(key, {
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
    });
  }

  async createCheckout(userId: string, dto: CreateCheckoutDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');

    let price = Number(course.discountPrice ?? course.price);

    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({ where: { code: dto.couponCode } });
      if (!coupon || !coupon.isActive) throw new BadRequestException('Invalid coupon');
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Coupon expired');
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('Coupon limit reached');
      if (coupon.courseId && coupon.courseId !== dto.courseId) throw new BadRequestException('Coupon not valid for this course');

      if (coupon.isPercent) {
        price = price * (1 - coupon.discount / 100);
      } else {
        price = Math.max(0, price - coupon.discount);
      }

      await this.prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    const paymentMethod = dto.paymentMethod || 'STRIPE';

    // Handle wallet payment
    if (paymentMethod === 'WALLET') {
      // Check user's wallet balance
      const walletBalance = await this.walletService.getUserBalance(userId);
      
      if (walletBalance < price) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // Deduct from wallet balance
      const newBalance = await this.walletService.updateUserBalance({
        userId,
        amount: price,
        type: 'DEBIT',
        reason: `Course purchase: ${course.title}`,
      });

      // Create enrollment
      const existingEnrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: dto.courseId } },
      });

      if (!existingEnrollment) {
        await this.prisma.enrollment.create({
          data: { userId, courseId: dto.courseId },
        });
      }

      // Create transaction record
      await this.prisma.transaction.create({
        data: {
          userId,
          courseId: dto.courseId,
          amount: price,
          currency: course.currency,
          status: 'COMPLETED',
          paymentMethod: PaymentMethod.WALLET,
          description: `Course purchase: ${course.title}`,
        },
      });

      return { enrolled: true, newBalance, paymentMethod: 'WALLET' };
    }

    // Handle free courses
    if (price <= 0) {
      const existingEnrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: dto.courseId } },
      });

      if (!existingEnrollment) {
        await this.prisma.enrollment.create({
          data: { userId, courseId: dto.courseId },
        });
      }

      await this.prisma.transaction.create({
        data: {
          userId,
          courseId: dto.courseId,
          amount: 0,
          status: 'COMPLETED',
          paymentMethod: PaymentMethod.STRIPE,
          description: 'Free enrollment',
        },
      });
      return { url: null, enrolled: true };
    }

    // Handle Stripe payment (default)
    if (paymentMethod === 'STRIPE') {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: course.currency.toLowerCase(),
              product_data: { name: course.title },
              unit_amount: Math.round(price * 100),
            },
            quantity: 1,
          },
        ],
        metadata: { userId, courseId: dto.courseId },
        success_url: `${this.config.get('APP_URL')}/courses/${course.slug}?payment=success`,
        cancel_url: `${this.config.get('APP_URL')}/courses/${course.slug}?payment=cancelled`,
      });

      return { url: session.url, sessionId: session.id, paymentMethod: 'STRIPE' };
    }

    // Handle Telebirr payment
    if (paymentMethod === 'TELEBIRR') {
      const { rawRequest, merchantOrderId } = await this.telebirrService.createOrder(
        userId,
        dto.courseId,
        price,
        `Course purchase: ${course.title}`,
      );

      // Create transaction record
      await this.prisma.transaction.create({
        data: {
          userId,
          courseId: dto.courseId,
          amount: price,
          currency: 'ETB',
          status: 'PENDING',
          paymentMethod: PaymentMethod.TELEBIRR,
          telebirrOrderId: merchantOrderId,
          rawRequest,
          description: `Course purchase: ${course.title}`,
        },
      });

      return { rawRequest, merchantOrderId, paymentMethod: 'TELEBIRR' };
    }

    throw new BadRequestException('Invalid payment method');
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret || '');
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const courseId = session.metadata?.courseId;

      if (userId && courseId) {
        // Use database transaction for atomicity
        await this.prisma.$transaction(async (tx) => {
          // Check if enrollment already exists (idempotency)
          const existingEnrollment = await tx.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
          });

          if (!existingEnrollment) {
            await tx.enrollment.create({
              data: { userId, courseId },
            });
          }

          // Check if transaction already exists
          const existingTransaction = await tx.transaction.findFirst({
            where: { stripePaymentId: session.payment_intent as string },
          });

          if (!existingTransaction) {
            await tx.transaction.create({
              data: {
                userId,
                courseId,
                amount: (session.amount_total || 0) / 100,
                status: 'COMPLETED',
                paymentMethod: PaymentMethod.STRIPE,
                stripePaymentId: session.payment_intent as string,
                description: 'Course purchase',
              },
            });
          }
        });
      }
    }

    return { received: true };
  }

  async getTransactions(userId: string, query: PaginationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { course: { select: { title: true, slug: true } } },
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);

    return new PaginatedResult(transactions, total, page, limit);
  }

  async getInstructorRevenue(instructorId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        course: { instructorId },
        status: 'COMPLETED',
      },
      select: { amount: true, createdAt: true },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const platformFee = this.config.get<number>('STRIPE_PLATFORM_FEE_PERCENT') || 20;
    const netRevenue = totalRevenue * (1 - platformFee / 100);

    return {
      totalRevenue,
      platformFee: totalRevenue - netRevenue,
      netRevenue,
      totalTransactions: transactions.length,
    };
  }

  // ============ TELEBIRR METHODS ============

  async createTelebirrOrder(userId: string, dto: CreateTelebirrOrderDto) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course || course.deletedAt) throw new NotFoundException('Course not found');

    // Create transaction record with PENDING status
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        courseId: dto.courseId,
        amount: dto.amount,
        currency: 'ETB',
        status: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.TELEBIRR,
        description: `Course purchase: ${course.title}`,
      },
    });

    // Call Telebirr service to create order
    const { rawRequest, merchantOrderId } = await this.telebirrService.createOrder(
      userId,
      dto.courseId,
      dto.amount,
      dto.title,
    );

    // Update transaction with Telebirr order ID
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        telebirrOrderId: merchantOrderId,
        rawRequest,
      },
    });

    this.logger.log(`Telebirr order created: ${merchantOrderId} for transaction ${transaction.id}`);

    return {
      transactionId: transaction.id,
      merchantOrderId,
      rawRequest,
    };
  }

  async handleTelebirrWebhook(payload: TelebirrWebhookDto) {
    // Verify signature
    const isValid = this.telebirrService.handleWebhook(payload);
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { merch_order_id, trade_status, total_amount, payment_order_id } = payload;

    // Find transaction by Telebirr order ID
    const transaction = await this.prisma.transaction.findUnique({
      where: { telebirrOrderId: merch_order_id },
      include: { course: true },
    });

    if (!transaction) {
      this.logger.warn(`Transaction not found for order: ${merch_order_id}`);
      return { received: true, message: 'Transaction not found' };
    }

    // Idempotency check - if already completed, return success
    if (transaction.status === PaymentStatus.COMPLETED) {
      this.logger.log(`Transaction ${transaction.id} already completed`);
      return { received: true, message: 'Already processed' };
    }

    // Map Telebirr status to internal status
    const internalStatus = this.telebirrService.mapTelebirrStatus(trade_status);

    // Verify amount BEFORE updating transaction
    if (internalStatus === PaymentStatus.COMPLETED) {
      if (parseFloat(total_amount) !== Number(transaction.amount)) {
        this.logger.error(
          `Amount mismatch for transaction ${transaction.id}: expected ${transaction.amount}, got ${total_amount}`,
        );
        throw new BadRequestException('Amount verification failed');
      }
    }

    // Use database transaction for atomicity
    await this.prisma.$transaction(async (tx) => {
      // Update transaction
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: internalStatus,
          telebirrTransactionId: payment_order_id,
          callbackData: payload as any,
        },
      });

      // If payment successful
      if (internalStatus === PaymentStatus.COMPLETED) {
        // Check if this is a wallet topup (courseId would be null or description indicates wallet topup)
        if (!transaction.courseId || transaction.description?.includes('Wallet Topup')) {
          // Credit user's wallet balance
          await this.walletService.updateUserBalance({
            userId: transaction.userId,
            amount: Number(transaction.amount),
            type: 'CREDIT',
            reason: 'Wallet topup via Telebirr',
          });
          this.logger.log(`Wallet balance credited for user ${transaction.userId}: ${transaction.amount} ETB`);
        } 
        // Otherwise, create course enrollment
        else if (transaction.courseId) {
          const existingEnrollment = await tx.enrollment.findUnique({
            where: { userId_courseId: { userId: transaction.userId, courseId: transaction.courseId } },
          });

          if (!existingEnrollment) {
            await tx.enrollment.create({
              data: {
                userId: transaction.userId,
                courseId: transaction.courseId,
              },
            });
            this.logger.log(`Enrollment created for user ${transaction.userId} in course ${transaction.courseId}`);
          } else {
            this.logger.log(`Enrollment already exists for user ${transaction.userId} in course ${transaction.courseId}`);
          }
        }
      }
    });

    return { received: true, message: 'Webhook processed successfully' };
  }

  async queryTelebirrOrder(merchantOrderId: string) {
    // Find transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { telebirrOrderId: merchantOrderId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Query Telebirr for current status
    const telebirrStatus = await this.telebirrService.queryOrder(merchantOrderId);
    const internalStatus = this.telebirrService.mapTelebirrStatus(telebirrStatus.status);

    // Update transaction if status changed
    if (transaction.status !== internalStatus) {
      await this.prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: internalStatus,
            telebirrTransactionId: telebirrStatus.telebirrRefId,
          },
        });

        // If payment successful, create enrollment
        if (internalStatus === PaymentStatus.COMPLETED && transaction.courseId) {
          const existingEnrollment = await tx.enrollment.findUnique({
            where: { userId_courseId: { userId: transaction.userId, courseId: transaction.courseId } },
          });

          if (!existingEnrollment) {
            await tx.enrollment.create({
              data: {
                userId: transaction.userId,
                courseId: transaction.courseId,
              },
            });
          }
        }
      });
    }

    return {
      transactionId: transaction.id,
      merchantOrderId: transaction.telebirrOrderId,
      status: internalStatus,
      telebirrStatus: telebirrStatus.status,
      amount: telebirrStatus.amount,
    };
  }

  async refundTelebirrOrder(dto: RefundTelebirrOrderDto) {
    // Find transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { telebirrOrderId: dto.merchantOrderId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed transactions can be refunded');
    }

    // Process refund with Telebirr
    const refundResult = await this.telebirrService.refundOrder(
      dto.merchantOrderId,
      dto.amount,
      dto.reason,
    );

    const refundStatus = this.telebirrService.mapRefundStatus(refundResult.status);

    // Update transaction status if refund successful
    if (refundStatus === 'COMPLETED') {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.REFUNDED,
        },
      });

      // Remove enrollment
      await this.prisma.enrollment.deleteMany({
        where: {
          userId: transaction.userId,
          courseId: transaction.courseId!,
        },
      });
    }

    return {
      transactionId: transaction.id,
      refundStatus,
      telebirrRefundId: refundResult.telebirrRefundId,
      refundAmount: refundResult.amount,
    };
  }
}
