import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './use-auth';

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  sortOrder: number;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  sortOrder: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  answers: Record<string, any>;
  completedAt: string;
}

export function useQuizzes(lessonId: string, options?: UseQueryOptions<Quiz[]>) {
  const { accessToken } = useAuth();
  return useQuery<Quiz[]>({
    queryKey: ['quizzes', lessonId],
    queryFn: () => api.get(`/quizzes/lesson/${lessonId}`, { token: accessToken || undefined }),
    enabled: !!lessonId && !!accessToken,
    ...options,
  });
}

export function useQuiz(id: string, options?: UseQueryOptions<Quiz>) {
  const { accessToken } = useAuth();
  return useQuery<Quiz>({
    queryKey: ['quiz', id],
    queryFn: () => api.get(`/quizzes/${id}`, { token: accessToken || undefined }),
    enabled: !!id && !!accessToken,
    ...options,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: (data: Partial<Quiz>) => 
      api.post('/quizzes', data, { token: accessToken || undefined }),
    onSuccess: (_, data) => {
      if (data.lessonId) {
        queryClient.invalidateQueries({ queryKey: ['quizzes', data.lessonId] });
      }
    },
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Quiz> }) => 
      api.patch(`/quizzes/${id}`, data, { token: accessToken || undefined }),
    onSuccess: (_, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', id] });
      if (data.lessonId) {
        queryClient.invalidateQueries({ queryKey: ['quizzes', data.lessonId] });
      }
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, lessonId }: { id: string; lessonId: string }) => 
      api.delete(`/quizzes/${id}`, { token: accessToken || undefined }),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', lessonId] });
    },
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ quizId, data }: { quizId: string; data: Partial<Question> }) => 
      api.post(`/quizzes/${quizId}/questions`, data, { token: accessToken || undefined }),
    onSuccess: (_, { quizId }) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: Partial<Question> }) => 
      api.patch(`/quizzes/questions/${questionId}`, data, { token: accessToken || undefined }),
    onSuccess: (_, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: ['question', questionId] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ questionId, quizId }: { questionId: string; quizId: string }) => 
      api.delete(`/quizzes/questions/${questionId}`, { token: accessToken || undefined }),
    onSuccess: (_, { quizId }) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
    },
  });
}

export function useReorderQuestions() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ quizId, questionIds }: { quizId: string; questionIds: string[] }) => 
      api.post(`/quizzes/questions/reorder`, { quizId, questionIds }, { token: accessToken || undefined }),
    onSuccess: (_, { quizId }) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
    },
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  
  return useMutation({
    mutationFn: ({ quizId, answers }: { quizId: string; answers: Record<string, any> }) => 
      api.post(`/quizzes/${quizId}/submit`, { answers }, { token: accessToken || undefined }),
    onSuccess: (_, { quizId }) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', quizId] });
    },
  });
}

export function useQuizAttempts(quizId: string, options?: UseQueryOptions<QuizAttempt[]>) {
  const { accessToken } = useAuth();
  return useQuery<QuizAttempt[]>({
    queryKey: ['quiz-attempts', quizId],
    queryFn: () => api.get(`/quizzes/${quizId}/attempts`, { token: accessToken || undefined }),
    enabled: !!quizId && !!accessToken,
    ...options,
  });
}
