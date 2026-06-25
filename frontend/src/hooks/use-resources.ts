import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Resource {
  id: string;
  title: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  lessonId?: string;
  courseId?: string;
  createdAt: string;
  updatedAt: string;
}

export function useResourcesByLesson(lessonId: string, options?: UseQueryOptions<Resource[]>) {
  return useQuery<Resource[]>({
    queryKey: ['resources', 'lesson', lessonId],
    queryFn: () => api.get(`/resources/lesson/${lessonId}`),
    enabled: !!lessonId,
    ...options,
  });
}

export function useResourcesByCourse(courseId: string, options?: UseQueryOptions<Resource[]>) {
  return useQuery<Resource[]>({
    queryKey: ['resources', 'course', courseId],
    queryFn: () => api.get(`/resources/course/${courseId}`),
    enabled: !!courseId,
    ...options,
  });
}

export function useResource(id: string, options?: UseQueryOptions<Resource>) {
  return useQuery<Resource>({
    queryKey: ['resource', id],
    queryFn: () => api.get(`/resources/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Resource>) => api.post('/resources', data),
    onSuccess: (_, data) => {
      if (data.lessonId) {
        queryClient.invalidateQueries({ queryKey: ['resources', 'lesson', data.lessonId] });
      }
      if (data.courseId) {
        queryClient.invalidateQueries({ queryKey: ['resources', 'course', data.courseId] });
      }
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Resource> }) => 
      api.put(`/resources/${id}`, data),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['resource', id] });
      if (data.lessonId) {
        queryClient.invalidateQueries({ queryKey: ['resources', 'lesson', data.lessonId] });
      }
      if (data.courseId) {
        queryClient.invalidateQueries({ queryKey: ['resources', 'course', data.courseId] });
      }
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, lessonId, courseId }: { id: string; lessonId?: string; courseId?: string }) => 
      api.delete(`/resources/${id}`),
    onSuccess: (_, { lessonId, courseId }) => {
      if (lessonId) {
        queryClient.invalidateQueries({ queryKey: ['resources', 'lesson', lessonId] });
      }
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['resources', 'course', courseId] });
      }
    },
  });
}
