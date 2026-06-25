import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Topic {
  id: string;
  title: string;
  courseId: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function useTopics(courseId: string, options?: UseQueryOptions<Topic[]>) {
  return useQuery<Topic[]>({
    queryKey: ['topics', courseId],
    queryFn: () => api.get(`/course-structure/courses/${courseId}/structure`, { token: undefined }),
    enabled: !!courseId,
    ...options,
  });
}

export function useTopic(id: string, options?: UseQueryOptions<Topic>) {
  return useQuery<Topic>({
    queryKey: ['topic', id],
    queryFn: () => api.get(`/topics/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Topic>) => api.post('/topics', data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['topics', data.courseId] });
    },
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Topic> }) => 
      api.put(`/topics/${id}`, data),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['topic', id] });
      if (data.courseId) {
        queryClient.invalidateQueries({ queryKey: ['topics', data.courseId] });
      }
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, courseId }: { id: string; courseId: string }) => 
      api.delete(`/topics/${id}`),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['topics', courseId] });
    },
  });
}

export function useReorderTopics() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, topicIds }: { courseId: string; topicIds: string[] }) => 
      api.post('/topics/reorder', { courseId, topicIds }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['topics', courseId] });
    },
  });
}
