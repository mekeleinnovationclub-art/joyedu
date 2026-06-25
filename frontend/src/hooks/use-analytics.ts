import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Analytics {
  totalStudents: number;
  totalRevenue: number;
  totalEnrollments: number;
  recentEnrollments: Enrollment[];
  courseStats: CourseStats[];
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: string;
  completedAt?: string;
  progress: number;
}

export interface CourseStats {
  courseId: string;
  courseTitle: string;
  studentCount: number;
  revenue: number;
  completionRate: number;
  averageRating: number;
}

export function useInstructorAnalytics(instructorId: string, options?: UseQueryOptions<Analytics>) {
  return useQuery<Analytics>({
    queryKey: ['analytics', instructorId],
    queryFn: () => api.get(`/analytics/instructor/${instructorId}`),
    enabled: !!instructorId,
    ...options,
  });
}

export function useCourseAnalytics(courseId: string, options?: UseQueryOptions<CourseStats>) {
  return useQuery<CourseStats>({
    queryKey: ['analytics', 'course', courseId],
    queryFn: () => api.get(`/analytics/course/${courseId}`),
    enabled: !!courseId,
    ...options,
  });
}
