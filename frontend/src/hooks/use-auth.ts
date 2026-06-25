'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import type { AuthResponse, TeacherApplication } from '@/types';
import { QueryClient, useQueryClient } from '@tanstack/react-query';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { 
    user, 
    accessToken, 
    refreshToken,
    isAuthenticated, 
    isHydrated,
    isInitializing,
    teacherApplication,
    setAuth, 
    setTokens,
    setTeacherApplication,
    setInitializing,
    setHydrated,
    logout: clearAuth,
  } = useAuthStore();

  // Initialize auth and validate session
  useEffect(() => {
    const initializeAuth = async () => {
      // Skip if no token exists
      if (!accessToken) {
        setInitializing(false);
        setHydrated();
        return;
      }

      try {
        // Validate session with backend
        const res = await api.get<{ user: AuthResponse['user']; teacherApplication?: TeacherApplication }>('/auth/me', { 
          token: accessToken,
          skipAuth: true,
        });
        
        // Update auth state with validated user data
        setAuth(res.user, accessToken, refreshToken || undefined);
        
        if (res.teacherApplication) {
          setTeacherApplication(res.teacherApplication);
        }
      } catch (error) {
        // Session validation failed - clear auth state
        clearAuth();
        localStorage.removeItem('joyedu-auth');
        sessionStorage.clear();
      } finally {
        setInitializing(false);
        setHydrated();
      }
    };

    if (!isHydrated) {
      initializeAuth();
    }
  }, [accessToken, refreshToken, isHydrated, setAuth, setTeacherApplication, setInitializing, setHydrated, clearAuth]);

  const refreshSession = async () => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const res = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
    setAuth(res.user, res.accessToken, res.refreshToken);
    return res;
  };

  // Set up 401 interceptor and token refresh
  useEffect(() => {
    const handle401 = async (error: Error, statusCode?: number) => {
      if (statusCode === 401) {
        // Clear auth state
        clearAuth();
        localStorage.removeItem('joyedu-auth');
        sessionStorage.clear();

        // Clear React Query caches
        queryClient.clear();

        // Redirect to login
        router.push('/login');

        return true;
      }
      return false;
    };

    api.setAuthInterceptor(handle401);
    api.setTokenRefreshFn(async () => {
      const res = await refreshSession();
      return { accessToken: res.accessToken, refreshToken: res.refreshToken };
    });

    return () => {
      api.setAuthInterceptor(() => false);
      api.setTokenRefreshFn(() => Promise.reject(new Error('No refresh fn')));
    };
  }, [clearAuth, queryClient, router, refreshSession]);

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    // Set auth state immediately
    setAuth(res.user, res.accessToken, res.refreshToken);
    // Mark as hydrated since we just logged in
    setHydrated();
    return res;
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const res = await api.post<{ user: AuthResponse['user']; verificationToken: string }>(
      '/auth/register',
      data,
    );
    return res;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', undefined, { token: accessToken || undefined });
    } catch {
      // ignore
    }
    clearAuth();
    localStorage.removeItem('joyedu-auth');
    sessionStorage.clear();
    queryClient.clear();
    router.push('/login');
  };

  const switchRole = async (role: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
    const res = await api.post<AuthResponse>('/auth/switch-role', { role }, { token: accessToken || undefined });
    setAuth(res.user, res.accessToken, res.refreshToken);
    return res;
  };

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isHydrated,
    isInitializing,
    teacherApplication,
    login,
    register,
    logout,
    switchRole,
    refreshSession,
  };
}
