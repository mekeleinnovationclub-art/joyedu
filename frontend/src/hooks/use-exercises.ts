import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './use-auth';

export interface Exercise {
  id: string;
  title: string;
  description?: string;
  hints?: string[];
  solution?: string;
  fileUrl?: string;
  lessonId: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function useExercises(lessonId: string, options?: UseQueryOptions<Exercise[]>) {
  const { accessToken } = useAuth();
  return useQuery<Exercise[]>({
    queryKey: ['exercises', lessonId],
    queryFn: () => api.get(`/exercises/lesson/${lessonId}`, { token: accessToken || undefined }),
    enabled: !!lessonId && !!accessToken,
    ...options,
  });
}

export function useExercise(id: string, options?: UseQueryOptions<Exercise>) {
  const { accessToken } = useAuth();
  return useQuery<Exercise>({
    queryKey: ['exercise', id],
    queryFn: () => api.get(`/exercises/${id}`, { token: accessToken || undefined }),
    enabled: !!id && !!accessToken,
    ...options,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: (data: Partial<Exercise>) => 
      api.post('/exercises', data, { token: accessToken || undefined }),
    onSuccess: (_, data) => {
      if (data.lessonId) {
        queryClient.invalidateQueries({ queryKey: ['exercises', data.lessonId] });
      }
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Exercise> }) => 
      api.patch(`/exercises/${id}`, data, { token: accessToken || undefined }),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['exercise', id] });
      if (data.lessonId) {
        queryClient.invalidateQueries({ queryKey: ['exercises', data.lessonId] });
      }
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, lessonId }: { id: string; lessonId: string }) => 
      api.delete(`/exercises/${id}`, { token: accessToken || undefined }),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ['exercises', lessonId] });
    },
  });
}

export function useReorderExercises() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ lessonId, exerciseIds }: { lessonId: string; exerciseIds: string[] }) => 
      api.post('/exercises/reorder', { lessonId, exerciseIds }, { token: accessToken || undefined }),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ['exercises', lessonId] });
    },
  });
}
