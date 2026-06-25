'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCourse } from '@/hooks/use-courses';

interface CourseOwnershipGuardProps {
  courseId: string;
  children: React.ReactNode;
  requireOwnership?: boolean;
  redirectTo?: string;
}

export function CourseOwnershipGuard({ 
  courseId, 
  children, 
  requireOwnership = true,
  redirectTo = '/dashboard'
}: CourseOwnershipGuardProps) {
  const { user, isInitializing, isHydrated } = useAuth();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const router = useRouter();
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    if (!isHydrated || isInitializing || courseLoading) return;

    // Check if user is authenticated
    if (!user) {
      router.push('/login');
      return;
    }

    // Admin can access any course
    if (user.roles.includes('ADMIN')) {
      setCanAccess(true);
      return;
    }

    // Teachers can only access their own courses
    if (user.roles.includes('TEACHER')) {
      if (!course) {
        router.push(redirectTo);
        return;
      }

      if (requireOwnership && course.instructorId !== user.id) {
        router.push(redirectTo);
        return;
      }

      setCanAccess(true);
      return;
    }

    // Students can access enrolled courses
    if (user.roles.includes('STUDENT')) {
      // For students, we'd need to check enrollment
      // For now, redirect students away from instructor pages
      router.push(redirectTo);
      return;
    }

    router.push(redirectTo);
  }, [user, isInitializing, isHydrated, course, courseLoading, requireOwnership, redirectTo, router]);

  if (!isHydrated || isInitializing || courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  return <>{children}</>;
}
