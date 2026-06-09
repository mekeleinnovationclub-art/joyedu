export const EXCLUDE_FIELDS = [
  'sign',
  'sign_type',
  'header',
  'refund_info',
  'openType',
  'raw_request',
  'biz_content',
  'wallet_reference_data',
];

export const TELEBIRR_METHODS = {
  APPLY_TOKEN: 'payment.applyh5token',
  PREORDER: 'payment.preorder',
  QUERY_ORDER: 'payment.queryorder',
  REFUND: 'payment.refund',
} as const;

export const TELEBIRR_STATUS = {
  PAY_SUCCESS: 'PAY_SUCCESS',
  PAY_FAILED: 'PAY_FAILED',
  WAIT_PAY: 'WAIT_PAY',
  PAYING: 'PAYING',
  ORDER_CLOSED: 'ORDER_CLOSED',
} as const;

export const REFUND_STATUS = {
  REFUND_SUCCESS: 'REFUND_SUCCESS',
  REFUNDING: 'REFUNDING',
  REFUND_FAILED: 'REFUND_FAILED',
  REFUND_DUPLICATED: 'REFUND_DUPLICATED',
} as const;
