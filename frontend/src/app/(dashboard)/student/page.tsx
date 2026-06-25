'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { walletApi } from '@/lib/wallet-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Trophy, Clock, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import type { Enrollment } from '@/types';
import { RoleProtectedRoute } from '@/components/common/route-guards';

function StudentDashboardContent() {
  const { user, accessToken } = useAuth();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.get<Enrollment[]>('/enrollments', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  const { data: walletBalance } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletApi.getBalance(accessToken || ''),
    enabled: !!accessToken,
  });

  const inProgress = enrollments?.filter((e) => !e.completedAt) || [];
  const completed = enrollments?.filter((e) => e.completedAt) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
        <p className="text-muted-foreground mt-1">Continue your learning journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{enrollments?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Enrolled Courses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completed.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgress.length}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {enrollments && enrollments.length > 0
                  ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
                  : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Avg Progress</p>
            </div>
          </CardContent>
        </Card>

        <Link href="/student/wallet">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{walletBalance?.balance.toFixed(2) || '0.00'} ETB</p>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Continue Learning</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : inProgress.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgress.slice(0, 4).map((enrollment) => (
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
              <h3 className="font-medium mb-2">No courses yet</h3>
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

export default function StudentDashboard() {
  return (
    <RoleProtectedRoute allowedRoles={['STUDENT']}>
      <StudentDashboardContent />
    </RoleProtectedRoute>
  );
}
