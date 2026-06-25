import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Course as FullCourse } from '@/types';

export interface Course extends FullCourse {}

export interface CourseFilter {
  status?: string;
  difficulty?: string;
  categoryId?: string;
  instructorId?: string;
  search?: string;
}

export function useCourses(filter?: CourseFilter, options?: { enabled?: boolean }) {
  return useQuery<Course[]>({
    queryKey: ['courses', filter],
    queryFn: () => api.get('/courses', filter as any),
    enabled: options?.enabled ?? true,
  });
}

export function useCourse(id: string, options?: { enabled?: boolean; token?: string }) {
  return useQuery<Course>({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`, { token: options?.token }),
    enabled: !!id && (options?.enabled ?? true),
  });
}

export function useFeaturedCourses(options?: { enabled?: boolean }) {
  return useQuery<Course[]>({
    queryKey: ['courses', 'featured'],
    queryFn: () => api.get('/courses/featured'),
    enabled: options?.enabled ?? true,
  });
}

export function useInstructorCourses(instructorId: string, options?: { enabled?: boolean }) {
  return useQuery<Course[]>({
    queryKey: ['courses', 'instructor', instructorId],
    queryFn: () => api.get(`/courses/instructor/${instructorId}`),
    enabled: !!instructorId && (options?.enabled ?? true),
  });
}

export function useStudentCourses(studentId: string, options?: { enabled?: boolean }) {
  return useQuery<Course[]>({
    queryKey: ['courses', 'student', studentId],
    queryFn: () => api.get(`/courses/student/${studentId}`),
    enabled: !!studentId && (options?.enabled ?? true),
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Course> }) => 
      api.put(`/courses/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function usePublishCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.patch(`/courses/${id}/publish`, { status: 'PUBLISHED' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });
}

export function useUnpublishCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.patch(`/courses/${id}/unpublish`, { status: 'DRAFT' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });
}

export function useArchiveCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.patch(`/courses/${id}/archive`, { status: 'ARCHIVED' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });
}
