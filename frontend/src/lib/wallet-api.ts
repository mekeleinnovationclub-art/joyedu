import { api } from './api';

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface WalletTopupRequest {
  amount: number;
  title?: string;
}

export interface WalletTopupResponse {
  success: boolean;
  rawRequest: string;
  merchantOrderId: string;
  transactionId: string;
}

export interface WalletWithdrawRequest {
  amount: number;
  phoneNumber: string;
  reason?: string;
}

export interface WalletWithdrawResponse {
  success: boolean;
  withdrawalId: string;
  transId?: string;
  status: string;
  newBalance: number;
}

export interface WalletPaymentRequest {
  courseId: string;
  amount: number;
  description?: string;
}

export interface WalletPaymentResponse {
  success: boolean;
  newBalance: number;
  message: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  transId?: string;
  reason?: string;
  telebirrDisbursementId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransferRequest {
  toUserId: string;
  amount: number;
  reason: string;
}

export interface WalletTransferResponse {
  success: boolean;
  newBalance: number;
}

export const walletApi = {
  // Get wallet balance
  getBalance: (token: string) => 
    api.get<WalletBalance>('/wallet/balance', { token }),

  // Wallet topup
  topup: (data: WalletTopupRequest, token: string) =>
    api.post<WalletTopupResponse>('/wallet/topup', data, { token }),

  // Wallet withdrawal
  withdraw: (data: WalletWithdrawRequest, token: string) =>
    api.post<WalletWithdrawResponse>('/wallet/withdraw', data, { token }),

  // Pay with wallet
  pay: (data: WalletPaymentRequest, token: string) =>
    api.post<WalletPaymentResponse>('/wallet/pay', data, { token }),

  // Get withdrawal history
  getWithdrawals: (token: string) =>
    api.get<{ withdrawals: Withdrawal[] }>('/wallet/withdrawals', { token }),

  // Get specific withdrawal
  getWithdrawal: (id: string, token: string) =>
    api.get<{ withdrawal: Withdrawal }>(`/wallet/withdrawals/${id}`, { token }),

  // Transfer balance
  transfer: (data: WalletTransferRequest, token: string) =>
    api.post<WalletTransferResponse>('/wallet/transfer', data, { token }),
};
