import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function useCategories(options?: UseQueryOptions<Category[]>) {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
    ...options,
  });
}

export function useCategory(id: string, options?: UseQueryOptions<Category>) {
  return useQuery<Category>({
    queryKey: ['category', id],
    queryFn: () => api.get(`/categories/${id}`),
    enabled: !!id,
    ...options,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Category>) => api.post('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => 
      api.put(`/categories/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
