import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as https from 'https';

export interface B2CDisbursementBizContent {
  appid: string;
  merch_code: string;
  out_trade_no: string;
  receive_name: string;
  receive_account: string;
  total_amount: string;
  trans_currency: string;
  notify_url: string;
  remark?: string;
}

export interface B2CDisbursementRequest {
  timestamp: string;
  nonce_str: string;
  method: string;
  sign_type: string;
  sign: string;
  version: string;
  biz_content: B2CDisbursementBizContent;
}

export interface B2CDisbursementResponseBizContent {
  out_trade_no: string;
  trans_id: string;
  status: string;
}

export interface B2CDisbursementResponse {
  result: string;
  code: string;
  msg: string;
  sign: string;
  nonce_str: string;
  sign_type: string;
  biz_content: B2CDisbursementResponseBizContent;
}

@Injectable()
export class B2CDisbursementService {
  private readonly logger = new Logger(B2CDisbursementService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async disburse(
    phoneNumber: string,
    amount: string,
    receiveName: string,
    fabricToken: string,
    remark?: string
  ): Promise<B2CDisbursementResponse> {
    try {
      const reqObject = this.createRequestObject(phoneNumber, amount, receiveName, remark);
      
      const baseUrl = this.configService.get<string>('TELEBIRR_BASE_URL');
      const url = `${baseUrl}/payment/v1/merchant/disburse`;
      
      this.logger.log(`Initiating B2C disbursement to ${phoneNumber} for amount: ${amount} ETB`);

      const httpsAgent = new https.Agent({
        rejectUnauthorized: !baseUrl?.includes('developerportal'),
      });

      const response = await firstValueFrom(
        this.httpService.post<B2CDisbursementResponse>(
          url,
          reqObject,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-APP-Key': this.configService.get<string>('TELEBIRR_X_APP_KEY'),
              'Authorization': `Bearer ${fabricToken}`,
            },
            httpsAgent,
          }
        )
      );

      this.logger.log(`B2C disbursement initiated successfully. Trans ID: ${response.data.biz_content.trans_id}`);
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to initiate B2C disbursement', error.stack);
      throw new Error('Failed to initiate B2C disbursement');
    }
  }

  private createRequestObject(
    phoneNumber: string,
    amount: string,
    receiveName: string,
    remark?: string
  ): B2CDisbursementRequest {
    const biz: B2CDisbursementBizContent = {
      appid: this.configService.get<string>('TELEBIRR_MERCHANT_APP_ID') || '',
      merch_code: this.configService.get<string>('TELEBIRR_MERCHANT_CODE') || '',
      out_trade_no: this.createMerchantOrderId(),
      receive_name: receiveName,
      receive_account: phoneNumber,
      total_amount: amount,
      trans_currency: 'ETB',
      notify_url: this.configService.get<string>('TELEBIRR_NOTIFY_URL') || '',
    };

    if (remark) {
      biz.remark = remark;
    }

    const req: any = {
      timestamp: this.createTimeStamp(),
      nonce_str: this.createNonceStr(),
      method: 'payment.disburse',
      version: '1.0',
      biz_content: biz,
    };

    req.sign = this.signRequestObject(req);
    req.sign_type = 'SHA256WithRSA';

    return req as B2CDisbursementRequest;
  }

  private createTimeStamp(): string {
    return Math.floor(Date.now() / 1000).toString();
  }

  private createNonceStr(): string {
    return require('crypto').randomBytes(16).toString('hex');
  }

  private createMerchantOrderId(): string {
    return Date.now().toString();
  }

  private buildQueryString(obj: any): string {
    const sortedKeys = Object.keys(obj).sort();
    const keyValuePairs = sortedKeys.map(key => {
      const value = typeof obj[key] === 'object' ? JSON.stringify(obj[key]) : obj[key];
      return `${key}=${value}`;
    });
    return keyValuePairs.join('&');
  }

  private signRequestObject(data: any): string {
    const { sign, sign_type, ...dataToSign } = data;

    let stringToSign = '';
    if (dataToSign.biz_content) {
      const { biz_content, ...rest } = dataToSign;
      stringToSign = this.buildQueryString(rest) + '&' + this.buildQueryString(biz_content);
    } else {
      stringToSign = this.buildQueryString(dataToSign);
    }

    const privateKey = this.configService.get<string>('TELEBIRR_PRIVATE_KEY') || '';
    const signature = require('crypto').sign('sha256', Buffer.from(stringToSign), {
      key: privateKey,
      padding: require('crypto').constants.RSA_PKCS1_PADDING,
    });

    return signature.toString('base64');
  }
}
