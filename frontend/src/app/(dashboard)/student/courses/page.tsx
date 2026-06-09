'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { Enrollment } from '@/types';

export default function StudentCourses() {
  const { user, accessToken } = useAuth();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.get<Enrollment[]>('/enrollments', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  const inProgress = enrollments?.filter((e: Enrollment) => !e.completedAt) || [];
  const completed = enrollments?.filter((e: Enrollment) => e.completedAt) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground mt-1">Manage your enrolled courses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed.length}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">All Courses</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : enrollments && enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.map((enrollment: Enrollment) => (
              <Link key={enrollment.id} href={`/courses/${enrollment.course.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-medium">{enrollment.course.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {enrollment.course.instructor.firstName} {enrollment.course.instructor.lastName}
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(enrollment.progress)}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No courses enrolled</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start exploring courses to begin your learning journey
              </p>
              <Link href="/courses">
                <button className="text-primary hover:underline text-sm font-medium">
                  Browse Courses
                </button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
