import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Subtopic {
  id: string;
  title: string;
  topicId: string;
  description?: string;
  summary?: string;
  keyTakeaways?: string[];
  nextSubtopicId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function useSubtopics(topicId: string, options?: UseQueryOptions<Subtopic[]>) {
  return useQuery<Subtopic[]>({
    queryKey: ['subtopics', topicId],
    queryFn: () => api.get(`/course-structure/courses/${topicId}/structure`, { token: undefined }),
    enabled: !!topicId,
    ...options,
  });
}

export function useSubtopic(id: string, options?: UseQueryOptions<Subtopic>) {
  return useQuery<Subtopic>({
    queryKey: ['subtopic', id],
    queryFn: () => api.get(`/subtopics/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useCreateSubtopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Subtopic>) => api.post('/subtopics', data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['subtopics', data.topicId] });
    },
  });
}

export function useUpdateSubtopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subtopic> }) => 
      api.put(`/subtopics/${id}`, data),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['subtopic', id] });
      if (data.topicId) {
        queryClient.invalidateQueries({ queryKey: ['subtopics', data.topicId] });
      }
    },
  });
}

export function useDeleteSubtopic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, topicId }: { id: string; topicId: string }) => 
      api.delete(`/subtopics/${id}`),
    onSuccess: (_, { topicId }) => {
      queryClient.invalidateQueries({ queryKey: ['subtopics', topicId] });
    },
  });
}

export function useReorderSubtopics() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ topicId, subtopicIds }: { topicId: string; subtopicIds: string[] }) => 
      api.post('/subtopics/reorder', { topicId, subtopicIds }),
    onSuccess: (_, { topicId }) => {
      queryClient.invalidateQueries({ queryKey: ['subtopics', topicId] });
    },
  });
}
