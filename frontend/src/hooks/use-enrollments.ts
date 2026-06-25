import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  lastAccessedAt?: string;
}

export function useEnrollments(userId: string, options?: { enabled?: boolean }) {
  return useQuery<Enrollment[]>({
    queryKey: ['enrollments', userId],
    queryFn: () => api.get(`/enrollments/user/${userId}`),
    enabled: !!userId && (options?.enabled ?? true),
  });
}

export function useCourseEnrollments(courseId: string, options?: { enabled?: boolean }) {
  return useQuery<Enrollment[]>({
    queryKey: ['enrollments', 'course', courseId],
    queryFn: () => api.get(`/enrollments/course/${courseId}`),
    enabled: !!courseId && (options?.enabled ?? true),
  });
}

export function useEnrollment(id: string, options?: { enabled?: boolean }) {
  return useQuery<Enrollment>({
    queryKey: ['enrollment', id],
    queryFn: () => api.get(`/enrollments/${id}`),
    enabled: !!id && (options?.enabled ?? true),
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, couponCode }: { courseId: string; couponCode?: string }) => 
      api.post('/enrollments', { courseId, couponCode }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'course', courseId] });
    },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Enrollment> }) => 
      api.put(`/enrollments/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', id] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/enrollments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
