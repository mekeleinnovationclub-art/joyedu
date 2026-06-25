import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CheckoutData {
  courseId: string;
  couponCode?: string;
  paymentMethod: 'telebirr' | 'card';
}

export interface CheckoutResponse {
  paymentUrl: string;
  transactionId: string;
  amount: number;
}

export function useCheckout() {
  const queryClient = useQueryClient();
  
  return useMutation<CheckoutResponse, Error, CheckoutData>({
    mutationFn: (data: CheckoutData) => 
      api.post('/checkout', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, courseId }: { code: string; courseId: string }) => 
      api.post('/coupons/validate', { code, courseId }),
  });
}
