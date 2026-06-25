import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CourseMedia {
  id: string;
  courseId: string;
  type: string;
  url: string;
  altText?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function useCourseMedia(courseId: string, options?: UseQueryOptions<CourseMedia[]>) {
  return useQuery<CourseMedia[]>({
    queryKey: ['course-media', courseId],
    queryFn: () => api.get(`/course-media/course/${courseId}`),
    enabled: !!courseId,
    ...options,
  });
}

export function useMediaItem(id: string, options?: UseQueryOptions<CourseMedia>) {
  return useQuery<CourseMedia>({
    queryKey: ['course-media', id],
    queryFn: () => api.get(`/course-media/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useCreateCourseMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<CourseMedia>) => api.post('/course-media', data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['course-media', data.courseId] });
    },
  });
}

export function useUpdateCourseMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CourseMedia> }) => 
      api.put(`/course-media/${id}`, data),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['course-media', id] });
      if (data.courseId) {
        queryClient.invalidateQueries({ queryKey: ['course-media', data.courseId] });
      }
    },
  });
}

export function useDeleteCourseMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, courseId }: { id: string; courseId: string }) => 
      api.delete(`/course-media/${id}`),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['course-media', courseId] });
    },
  });
}

export function useReorderCourseMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, mediaIds }: { courseId: string; mediaIds: string[] }) => 
      api.post('/course-media/reorder', { courseId, mediaIds }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['course-media', courseId] });
    },
  });
}
