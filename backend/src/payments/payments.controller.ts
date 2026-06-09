import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  Param,
  UseGuards,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { TelebirrService } from './telebirr/telebirr.service';
import { CreateCheckoutDto } from './dto/payments.dto';
import { CreateTelebirrOrderDto, TelebirrWebhookDto, QueryTelebirrOrderDto, RefundTelebirrOrderDto } from './telebirr/dto/telebirr.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private telebirrService: TelebirrService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  async createCheckout(@CurrentUser() user: JwtPayload, @Body() dto: CreateCheckoutDto) {
    return this.paymentsService.createCheckout(user.sub, dto);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody!, signature);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('telebirr/create-order')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Telebirr payment order' })
  async createTelebirrOrder(@CurrentUser() user: JwtPayload, @Body() dto: CreateTelebirrOrderDto) {
    return this.paymentsService.createTelebirrOrder(user.sub, dto);
  }

  @Public()
  @Post('telebirr/webhook')
  @ApiOperation({ summary: 'Telebirr webhook' })
  async handleTelebirrWebhook(@Body() payload: TelebirrWebhookDto) {
    return this.paymentsService.handleTelebirrWebhook(payload);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('telebirr/status/:merchantOrderId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Query Telebirr order status' })
  async queryTelebirrOrder(@Param('merchantOrderId') merchantOrderId: string) {
    return this.paymentsService.queryTelebirrOrder(merchantOrderId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Post('telebirr/refund')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund Telebirr order' })
  async refundTelebirrOrder(@Body() dto: RefundTelebirrOrderDto) {
    return this.paymentsService.refundTelebirrOrder(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('transactions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user transactions' })
  async getTransactions(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.paymentsService.getTransactions(user.sub, query);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER')
  @Get('revenue')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get instructor revenue' })
  async getInstructorRevenue(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.getInstructorRevenue(user.sub);
  }
}
