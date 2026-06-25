import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Announcement {
  id: string;
  courseId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function useAnnouncements(courseId: string, options?: UseQueryOptions<Announcement[]>) {
  return useQuery<Announcement[]>({
    queryKey: ['announcements', courseId],
    queryFn: () => api.get(`/announcements/course/${courseId}`),
    enabled: !!courseId,
    ...options,
  });
}

export function useAnnouncement(id: string, options?: UseQueryOptions<Announcement>) {
  return useQuery<Announcement>({
    queryKey: ['announcement', id],
    queryFn: () => api.get(`/announcements/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Announcement>) => api.post('/announcements', data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['announcements', data.courseId] });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Announcement> }) => 
      api.put(`/announcements/${id}`, data),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
      if (data.courseId) {
        queryClient.invalidateQueries({ queryKey: ['announcements', data.courseId] });
      }
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, courseId }: { id: string; courseId: string }) => 
      api.delete(`/announcements/${id}`),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['announcements', courseId] });
    },
  });
}
