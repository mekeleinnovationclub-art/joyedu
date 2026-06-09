export interface TelebirrConfig {
  baseUrl: string;
  xAppKey: string;
  appSecret: string;
  merchantAppId: string;
  merchantCode: string;
  privateKeyPath: string;
  publicKeyPath: string;
  notifyUrl: string;
  redirectUrl: string;
}

export interface FabricTokenResponse {
  token: string;
  effectiveDate: string;
  expirationDate: string;
}

export interface TelebirrBaseRequest {
  timestamp: string;
  nonce_str: string;
  method: string;
  version: string;
  sign?: string;
  sign_type?: string;
  biz_content?: Record<string, any>;
}

export interface TelebirrPreOrderRequest extends TelebirrBaseRequest {
  method: 'payment.preorder';
  biz_content: {
    notify_url: string;
    redirect_url: string;
    appid: string;
    merch_code: string;
    merch_order_id: string;
    trade_type: 'InApp';
    title: string;
    total_amount: string;
    trans_currency: string;
    timeout_express: string;
    business_type: string;
    payee_type: string;
    payee_identifier: string;
    payee_identifier_type: string;
  };
}

export interface TelebirrPreOrderResponse {
  result: string;
  code: string;
  msg: string;
  biz_content: {
    prepay_id: string;
  };
}

export interface TelebirrQueryOrderRequest extends TelebirrBaseRequest {
  method: 'payment.queryorder';
  biz_content: {
    appid: string;
    merch_code: string;
    merch_order_id: string;
  };
}

export interface TelebirrQueryOrderResponse {
  result: string;
  code: string;
  msg: string;
  biz_content: {
    order_status: string;
    payment_order_id: string;
    total_amount: string;
  };
}

export interface TelebirrRefundRequest extends TelebirrBaseRequest {
  method: 'payment.refund';
  biz_content: {
    appid: string;
    merch_code: string;
    merch_order_id: string;
    refund_request_no: string;
    actual_amount: string;
    trans_currency: string;
    refund_reason: string;
  };
}

export interface TelebirrRefundResponse {
  result: string;
  code: string;
  msg: string;
  biz_content: {
    refund_status: string;
    refund_order_id: string;
    refund_amount: string;
  };
}

export interface TelebirrWebhookPayload {
  merch_order_id: string;
  trade_status: string;
  total_amount: string;
  payment_order_id: string;
  sign: string;
  sign_type: string;
  [key: string]: any;
}

export interface RawRequestParams {
  appid: string;
  merch_code: string;
  nonce_str: string;
  prepay_id: string;
  timestamp: string;
  sign: string;
  sign_type: string;
}
