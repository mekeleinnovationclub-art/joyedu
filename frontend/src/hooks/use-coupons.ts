import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  isPercent: boolean;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  courseId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useCoupons(courseId: string, options?: UseQueryOptions<Coupon[]>) {
  return useQuery<Coupon[]>({
    queryKey: ['coupons', courseId],
    queryFn: () => api.get(`/coupons/course/${courseId}`),
    enabled: !!courseId,
    ...options,
  });
}

export function useAllCoupons(options?: UseQueryOptions<Coupon[]>) {
  return useQuery<Coupon[]>({
    queryKey: ['coupons'],
    queryFn: () => api.get('/coupons'),
    ...options,
  });
}

export function useCoupon(id: string, options?: UseQueryOptions<Coupon>) {
  return useQuery<Coupon>({
    queryKey: ['coupon', id],
    queryFn: () => api.get(`/coupons/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Coupon>) => api.post('/coupons', data),
    onSuccess: (_, data) => {
      if (data.courseId) {
        queryClient.invalidateQueries({ queryKey: ['coupons', data.courseId] });
      }
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Coupon> }) => 
      api.put(`/coupons/${id}`, data),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['coupon', id] });
      if (data.courseId) {
        queryClient.invalidateQueries({ queryKey: ['coupons', data.courseId] });
      }
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, courseId }: { id: string; courseId?: string }) => 
      api.delete(`/coupons/${id}`),
    onSuccess: (_, { courseId }) => {
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['coupons', courseId] });
      }
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, courseId }: { code: string; courseId?: string }) => 
      api.post('/coupons/validate', { code, courseId }),
  });
}
