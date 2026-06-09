import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as https from 'https';
import type {
  TelebirrConfig,
  FabricTokenResponse,
  TelebirrPreOrderRequest,
  TelebirrPreOrderResponse,
  TelebirrQueryOrderRequest,
  TelebirrQueryOrderResponse,
  TelebirrRefundRequest,
  TelebirrRefundResponse,
  TelebirrWebhookPayload,
} from './telebirr.types';
import { TELEBIRR_METHODS, TELEBIRR_STATUS, REFUND_STATUS } from './telebirr.constants';
import {
  createTimeStamp,
  createNonceStr,
  signRequestObject,
  verifyTelebirrSignature,
  createRawRequest,
  loadPrivateKey,
  loadPublicKey,
} from './telebirr.utils';

@Injectable()
export class TelebirrService {
  private readonly logger = new Logger(TelebirrService.name);
  private config: TelebirrConfig | null = null;
  private privateKey: string | null = null;
  private publicKey: string | null = null;
  private fabricTokenCache: { token: string; expiresAt: Date } | null = null;
  private initialized = false;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    // Lazy initialization - config and keys loaded only when needed
  }

  private ensureInitialized() {
    if (this.initialized) return;

    this.config = {
      baseUrl: this.configService.get<string>('TELEBIRR_BASE_URL')!,
      xAppKey: this.configService.get<string>('TELEBIRR_X_APP_KEY')!,
      appSecret: this.configService.get<string>('TELEBIRR_APP_SECRET')!,
      merchantAppId: this.configService.get<string>('TELEBIRR_MERCHANT_APP_ID')!,
      merchantCode: this.configService.get<string>('TELEBIRR_MERCHANT_CODE')!,
      privateKeyPath: this.configService.get<string>('TELEBIRR_PRIVATE_KEY_PATH')!,
      publicKeyPath: this.configService.get<string>('TELEBIRR_PUBLIC_KEY_PATH')!,
      notifyUrl: this.configService.get<string>('TELEBIRR_NOTIFY_URL')!,
      redirectUrl: this.configService.get<string>('TELEBIRR_REDIRECT_URL')!,
    };

    this.privateKey = loadPrivateKey(this.config.privateKeyPath);
    this.publicKey = loadPublicKey(this.config.publicKeyPath);
    this.initialized = true;
  }

  /**
   * Step 1: Apply Fabric Token
   * Get authorization token for subsequent API calls
   */
  private async applyFabricToken(): Promise<string> {
    this.ensureInitialized();

    // Check if cached token is still valid (with 5 minute buffer)
    if (
      this.fabricTokenCache &&
      this.fabricTokenCache.expiresAt > new Date(Date.now() + 5 * 60 * 1000)
    ) {
      return this.fabricTokenCache.token;
    }

    try {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: !this.config!.baseUrl.includes('developerportal'),
      });

      const response = await firstValueFrom(
        this.httpService.post<FabricTokenResponse>(
          `${this.config!.baseUrl}/payment/v1/token`,
          { appSecret: this.config!.appSecret },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-APP-Key': this.config!.xAppKey,
            },
            httpsAgent,
          },
        ),
      );

      const tokenData = response.data;
      const expiresAt = new Date(tokenData.expirationDate);

      // Cache the token
      this.fabricTokenCache = {
        token: tokenData.token,
        expiresAt,
      };

      this.logger.debug('Fabric token obtained successfully');
      return tokenData.token;
    } catch (error) {
      this.logger.error('Failed to fetch Telebirr fabric token:', error);
      throw new BadRequestException('Failed to obtain authorization token');
    }
  }

  /**
   * Step 3: Request Create Order
   * Create a payment order and return rawRequest string for frontend
   */
  async createOrder(
    userId: string,
    courseId: string,
    amount: number,
    title: string,
  ): Promise<{ rawRequest: string; merchantOrderId: string }> {
    this.ensureInitialized();

    try {
      // 1. Get fabric token
      const fabricToken = await this.applyFabricToken();

      // 2. Generate unique merchant order ID
      const merchantOrderId = `ORD_${Date.now()}_${Math.floor(Math.random() * 9000) + 1000}`;

      // 3. Build preorder request payload
      const payload: TelebirrPreOrderRequest = {
        timestamp: createTimeStamp(),
        nonce_str: createNonceStr(),
        method: TELEBIRR_METHODS.PREORDER,
        version: '1.0',
        biz_content: {
          notify_url: this.config!.notifyUrl,
          redirect_url: this.config!.redirectUrl,
          appid: this.config!.merchantAppId,
          merch_code: this.config!.merchantCode,
          merch_order_id: merchantOrderId,
          trade_type: 'InApp',
          title,
          total_amount: amount.toString(),
          trans_currency: 'ETB',
          timeout_express: '120m',
          business_type: 'BuyGoods',
          payee_type: '3000',
          payee_identifier: this.config!.merchantCode,
          payee_identifier_type: '04',
        },
      };

      // 4. Sign the payload
      payload.sign = signRequestObject(payload, this.privateKey!);
      payload.sign_type = 'SHA256WithRSA';

      // 5. Submit to Telebirr
      const httpsAgent = new https.Agent({
        rejectUnauthorized: !this.config!.baseUrl.includes('developerportal'),
      });

      const response = await firstValueFrom(
        this.httpService.post<TelebirrPreOrderResponse>(
          `${this.config!.baseUrl}/payment/v1/merchant/preOrder`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-APP-Key': this.config!.xAppKey,
              Authorization: fabricToken,
            },
            httpsAgent,
          },
        ),
      );

      const orderResult = response.data;

      if (orderResult.result !== 'SUCCESS' || orderResult.code !== '0') {
        this.logger.error('Telebirr order creation failed:', orderResult);
        throw new BadRequestException(
          `Telebirr order initialization failed: ${orderResult.msg}`,
        );
      }

      // 6. Generate rawRequest string for frontend
      const prepayId = orderResult.biz_content.prepay_id;
      const rawRequest = createRawRequest(
        prepayId,
        this.config!.merchantAppId,
        this.config!.merchantCode,
        this.privateKey!,
      );

      this.logger.log(`Order created: ${merchantOrderId}, prepayId: ${prepayId}`);

      return { rawRequest, merchantOrderId };
    } catch (error) {
      this.logger.error('Error creating Telebirr order:', error);
      throw error;
    }
  }

  /**
   * Step 5: Query Order
   * Check payment status from Telebirr
   */
  async queryOrder(merchantOrderId: string): Promise<{
    status: string;
    telebirrRefId: string;
    amount: string;
  }> {
    this.ensureInitialized();

    try {
      // 1. Get fabric token
      const fabricToken = await this.applyFabricToken();

      // 2. Build query request
      const payload: TelebirrQueryOrderRequest = {
        timestamp: createTimeStamp(),
        nonce_str: createNonceStr(),
        method: TELEBIRR_METHODS.QUERY_ORDER,
        version: '1.0',
        biz_content: {
          appid: this.config!.merchantAppId,
          merch_code: this.config!.merchantCode,
          merch_order_id: merchantOrderId,
        },
      };

      // 3. Sign the payload
      payload.sign = signRequestObject(payload, this.privateKey!);
      payload.sign_type = 'SHA256WithRSA';

      // 4. Submit query
      const httpsAgent = new https.Agent({
        rejectUnauthorized: !this.config!.baseUrl.includes('developerportal'),
      });

      const response = await firstValueFrom(
        this.httpService.post<TelebirrQueryOrderResponse>(
          `${this.config!.baseUrl}/payment/v1/merchant/queryOrder`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-APP-Key': this.config!.xAppKey,
              Authorization: fabricToken,
            },
            httpsAgent,
          },
        ),
      );

      const queryResult = response.data;

      if (queryResult.result !== 'SUCCESS' || queryResult.code !== '0') {
        this.logger.error('Telebirr query failed:', queryResult);
        throw new BadRequestException(
          `Telebirr query failed: ${queryResult.msg}`,
        );
      }

      // 5. Parse and return status
      const { order_status, payment_order_id, total_amount } =
        queryResult.biz_content;

      return {
        status: order_status,
        telebirrRefId: payment_order_id,
        amount: total_amount,
      };
    } catch (error) {
      this.logger.error(`Error querying Telebirr order (${merchantOrderId}):`, error);
      throw error;
    }
  }

  /**
   * Step 5: Handle Webhook
   * Process payment notification from Telebirr
   */
  handleWebhook(payload: TelebirrWebhookPayload): boolean {
    this.ensureInitialized();

    this.logger.log('Incoming Telebirr Webhook Payload:', payload);

    // 1. Validate timestamp to prevent replay attacks (5 minute window)
    if (payload.timestamp) {
      const webhookTime = parseInt(payload.timestamp);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = Math.abs(currentTime - webhookTime);

      if (timeDiff > 300) { // 5 minutes
        this.logger.warn(`Webhook timestamp too old: ${timeDiff} seconds difference`);
        return false;
      }
    }

    // 2. Cryptographically authenticate the payload
    const isAuthentic = verifyTelebirrSignature(payload, this.publicKey!);
    if (!isAuthentic) {
      this.logger.warn('Invalid signature received from Telebirr webhook');
      return false;
    }

    this.logger.log('Webhook signature verified successfully');
    return true;
  }

  /**
   * Step 8: Refund Order
   * Process refund for a transaction
   */
  async refundOrder(
    originalMerchantOrderId: string,
    amountToRefund: number,
    reason: string = 'Customer Request',
  ): Promise<{
    status: string;
    telebirrRefundId: string;
    amount: string;
  }> {
    this.ensureInitialized();

    try {
      // 1. Get fabric token
      const fabricToken = await this.applyFabricToken();

      // 2. Generate unique refund request number
      const refundRequestNo = `REF_${Date.now()}_${Math.floor(Math.random() * 9000) + 1000}`;

      // 3. Build refund request
      const payload: TelebirrRefundRequest = {
        timestamp: createTimeStamp(),
        nonce_str: createNonceStr(),
        method: TELEBIRR_METHODS.REFUND,
        version: '1.0',
        biz_content: {
          appid: this.config!.merchantAppId,
          merch_code: this.config!.merchantCode,
          merch_order_id: originalMerchantOrderId,
          refund_request_no: refundRequestNo,
          actual_amount: amountToRefund.toString(),
          trans_currency: 'ETB',
          refund_reason: reason,
        },
      };

      // 4. Sign the payload
      payload.sign = signRequestObject(payload, this.privateKey!);
      payload.sign_type = 'SHA256WithRSA';

      // 5. Submit refund request
      const httpsAgent = new https.Agent({
        rejectUnauthorized: !this.config!.baseUrl.includes('developerportal'),
      });

      const response = await firstValueFrom(
        this.httpService.post<TelebirrRefundResponse>(
          `${this.config!.baseUrl}/payment/v1/merchant/refund`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-APP-Key': this.config!.xAppKey,
              Authorization: fabricToken,
            },
            httpsAgent,
          },
        ),
      );

      const refundResult = response.data;

      if (refundResult.result !== 'SUCCESS' || refundResult.code !== '0') {
        this.logger.error('Telebirr refund failed:', refundResult);
        throw new BadRequestException(
          `Telebirr refund failed: ${refundResult.msg}`,
        );
      }

      // 6. Parse and return refund status
      const { refund_status, refund_order_id, refund_amount } =
        refundResult.biz_content;

      return {
        status: refund_status,
        telebirrRefundId: refund_order_id,
        amount: refund_amount,
      };
    } catch (error) {
      this.logger.error(
        `Error refunding order (${originalMerchantOrderId}):`,
        error,
      );
      throw error;
    }
  }

  /**
   * Map Telebirr status to internal PaymentStatus
   */
  mapTelebirrStatus(telebirrStatus: string): 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' {
    switch (telebirrStatus) {
      case TELEBIRR_STATUS.PAY_SUCCESS:
        return 'COMPLETED';
      case TELEBIRR_STATUS.WAIT_PAY:
      case TELEBIRR_STATUS.PAYING:
        return 'PROCESSING';
      case TELEBIRR_STATUS.PAY_FAILED:
      case TELEBIRR_STATUS.ORDER_CLOSED:
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Map refund status to internal status
   */
  mapRefundStatus(refundStatus: string): 'COMPLETED' | 'PROCESSING' | 'FAILED' {
    switch (refundStatus) {
      case REFUND_STATUS.REFUND_SUCCESS:
        return 'COMPLETED';
      case REFUND_STATUS.REFUNDING:
        return 'PROCESSING';
      case REFUND_STATUS.REFUND_FAILED:
      case REFUND_STATUS.REFUND_DUPLICATED:
        return 'FAILED';
      default:
        return 'PROCESSING';
    }
  }
}
