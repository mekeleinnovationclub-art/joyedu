import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  difficulty: string;
}

export interface Prerequisite {
  id: string;
  courseId: string;
  prerequisiteId: string;
  prerequisite: Course;
  createdAt: string;
}

export function usePrerequisites(courseId: string, options?: UseQueryOptions<Prerequisite[]>) {
  return useQuery<Prerequisite[]>({
    queryKey: ['prerequisites', courseId],
    queryFn: () => api.get(`/course-prerequisites/course/${courseId}`),
    enabled: !!courseId,
    ...options,
  });
}

export function useAvailablePrerequisiteCourses(courseId: string, options?: UseQueryOptions<Course[]>) {
  return useQuery<Course[]>({
    queryKey: ['available-courses', courseId],
    queryFn: () => api.get(`/course-prerequisites/available/${courseId}`),
    enabled: !!courseId,
    ...options,
  });
}

export function useAddPrerequisite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, prerequisiteId }: { courseId: string; prerequisiteId: string }) => 
      api.post('/course-prerequisites', { courseId, prerequisiteId }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['prerequisites', courseId] });
      queryClient.invalidateQueries({ queryKey: ['available-courses', courseId] });
    },
  });
}

export function useBulkAddPrerequisites() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, prerequisiteIds }: { courseId: string; prerequisiteIds: string[] }) => 
      api.post('/course-prerequisites/bulk', { courseId, prerequisiteIds }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['prerequisites', courseId] });
      queryClient.invalidateQueries({ queryKey: ['available-courses', courseId] });
    },
  });
}

export function useRemovePrerequisite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, prerequisiteId }: { courseId: string; prerequisiteId: string }) => 
      api.post('/course-prerequisites/remove', { courseId, prerequisiteId }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['prerequisites', courseId] });
      queryClient.invalidateQueries({ queryKey: ['available-courses', courseId] });
    },
  });
}
