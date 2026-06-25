import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './use-auth';

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  subtopicId: string;
  type: string;
  content?: string;
  videoUrl?: string;
  videoDuration?: number;
  isFree: boolean;
  status?: string;
  summary?: string;
  keyTakeaways?: string[];
  nextLessonId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function useLessons(subtopicId: string, options?: UseQueryOptions<Lesson[]>) {
  const { accessToken } = useAuth();
  return useQuery<Lesson[]>({
    queryKey: ['lessons', subtopicId],
    queryFn: () => api.get(`/subtopics/${subtopicId}/lessons`, { token: accessToken || undefined }),
    enabled: !!subtopicId && !!accessToken,
    ...options,
  });
}

export function useLesson(id: string, options?: UseQueryOptions<Lesson>) {
  const { accessToken } = useAuth();
  return useQuery<Lesson>({
    queryKey: ['lesson', id],
    queryFn: () => api.get(`/lessons/${id}`, { token: accessToken || undefined }),
    enabled: !!id && !!accessToken,
    ...options,
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: (data: Partial<Lesson>) => 
      api.post('/lessons', data, { token: accessToken || undefined }),
    onSuccess: (_, data) => {
      if (data.subtopicId) {
        queryClient.invalidateQueries({ queryKey: ['lessons', data.subtopicId] });
      }
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lesson> }) => 
      api.patch(`/lessons/${id}`, data, { token: accessToken || undefined }),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['lesson', id] });
      if (data.subtopicId) {
        queryClient.invalidateQueries({ queryKey: ['lessons', data.subtopicId] });
      }
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, subtopicId }: { id: string; subtopicId: string }) => 
      api.delete(`/lessons/${id}`, { token: accessToken || undefined }),
    onSuccess: (_, { subtopicId }) => {
      queryClient.invalidateQueries({ queryKey: ['lessons', subtopicId] });
    },
  });
}

export function useReorderLessons() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ subtopicId, lessonIds }: { subtopicId: string; lessonIds: string[] }) => 
      api.post('/lessons/reorder', { subtopicId, lessonIds }, { token: accessToken || undefined }),
    onSuccess: (_, { subtopicId }) => {
      queryClient.invalidateQueries({ queryKey: ['lessons', subtopicId] });
    },
  });
}

export function useDuplicateLesson() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: (id: string) => 
      api.post(`/lessons/${id}/duplicate`, {}, { token: accessToken || undefined }),
    onSuccess: (_, id) => {
      // Invalidate the lesson query to get the duplicated lesson
      queryClient.invalidateQueries({ queryKey: ['lesson', id] });
    },
  });
}
