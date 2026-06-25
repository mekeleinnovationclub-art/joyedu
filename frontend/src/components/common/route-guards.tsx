'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import type { ActiveRole } from '@/types';
import { Loader2 } from 'lucide-react';

// Centralized role-based redirect function
export function getDashboardPath(role: ActiveRole): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'TEACHER':
      return '/teacher';
    case 'STUDENT':
    default:
      return '/student';
  }
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isInitializing && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isInitializing, isHydrated, router]);

  if (!isHydrated || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  return <>{children}</>;
}

interface PublicRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PublicRoute({ children, fallback }: PublicRouteProps) {
  const { isAuthenticated, isInitializing, isHydrated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isInitializing && isAuthenticated && user) {
      router.push(getDashboardPath(user.activeRole));
    }
  }, [isAuthenticated, isInitializing, isHydrated, user, router]);

  if (!isHydrated || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return fallback || null;
  }

  return <>{children}</>;
}

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ActiveRole[];
  fallback?: React.ReactNode;
}

export function RoleProtectedRoute({ children, allowedRoles, fallback }: RoleProtectedRouteProps) {
  const { isAuthenticated, isInitializing, isHydrated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isInitializing) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (user && !allowedRoles.includes(user.activeRole)) {
        // Redirect to appropriate dashboard based on user's role
        router.push(getDashboardPath(user.activeRole));
      }
    }
  }, [isAuthenticated, isInitializing, isHydrated, user, allowedRoles, router]);

  if (!isHydrated || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  if (user && !allowedRoles.includes(user.activeRole)) {
    return fallback || null;
  }

  return <>{children}</>;
}

interface GuestOnlyRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function GuestOnlyRoute({ children, fallback }: GuestOnlyRouteProps) {
  const { isAuthenticated, isInitializing, isHydrated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if fully hydrated, not initializing, authenticated, and user exists
    if (isHydrated && !isInitializing && isAuthenticated && user) {
      router.push(getDashboardPath(user.activeRole));
    }
  }, [isAuthenticated, isInitializing, isHydrated, user, router]);

  // Don't show loading screen - render immediately for public auth pages
  // Redirect will happen in useEffect after hydration if user is authenticated
  if (isAuthenticated && isHydrated && !isInitializing) {
    return fallback || null;
  }

  return <>{children}</>;
}
