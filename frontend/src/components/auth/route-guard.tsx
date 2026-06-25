'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export function RouteGuard({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  redirectTo = '/login'
}: RouteGuardProps) {
  const { user, isInitializing, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated || isInitializing) return;

    // Check if authentication is required
    if (requireAuth && !user) {
      router.push(redirectTo);
      return;
    }

    // Check if user has required role
    if (allowedRoles.length > 0 && user) {
      const hasRequiredRole = allowedRoles.some(role => user.roles.includes(role));
      if (!hasRequiredRole) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, isInitializing, isHydrated, requireAuth, allowedRoles, redirectTo, router]);

  if (!isHydrated || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (allowedRoles.length > 0 && user) {
    const hasRequiredRole = allowedRoles.some(role => user.roles.includes(role));
    if (!hasRequiredRole) {
      return null;
    }
  }

  return <>{children}</>;
}

export function TeacherRoute({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['TEACHER', 'ADMIN']}>
      {children}
    </RouteGuard>
  );
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      {children}
    </RouteGuard>
  );
}

export function StudentRoute({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
      {children}
    </RouteGuard>
  );
}
