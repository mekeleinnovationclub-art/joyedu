import { api } from './api';
import type { TeacherApplication, ApiResponse } from '@/types';

export interface CreateTeacherApplicationData {
  bio: string;
  expertise: string[];
  experience: string;
  portfolioLinks: string[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
}

export interface UpdateTeacherApplicationData extends Partial<CreateTeacherApplicationData> {}

export const teacherApi = {
  // Get current user's teacher application
  getMyApplication: (token: string) =>
    api.get<ApiResponse<TeacherApplication>>('/teacher-applications/me', { token }),

  // Create a new teacher application
  createApplication: (data: CreateTeacherApplicationData, token: string) =>
    api.post<ApiResponse<TeacherApplication>>('/teacher-applications', data, { token }),

  // Update teacher application (if pending)
  updateApplication: (id: string, data: UpdateTeacherApplicationData, token: string) =>
    api.patch<ApiResponse<TeacherApplication>>(`/teacher-applications/${id}`, data, { token }),

  // Get application status
  getApplicationStatus: (token: string) =>
    api.get<ApiResponse<{ status: TeacherApplication['status'] }>>('/teacher-applications/me/status', { token }),
};
