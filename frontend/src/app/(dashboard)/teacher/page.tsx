'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, DollarSign, PlusCircle, Users, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import type { Course } from '@/types';
import { RoleProtectedRoute } from '@/components/common/route-guards';

function TeacherDashboardContent() {
  const { user, accessToken } = useAuth();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () =>
      api.get<Course[]>('/courses/instructor/my-courses', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  const { data: revenue } = useQuery({
    queryKey: ['instructor-revenue'],
    queryFn: () =>
      api.get<{
        totalRevenue: number;
        netRevenue: number;
        platformFee: number;
        totalTransactions: number;
      }>('/payments/revenue', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  const publishedCourses = courses?.filter((c) => c.status === 'PUBLISHED') || [];
  const draftCourses = courses?.filter((c) => c.status === 'DRAFT') || [];
  const totalStudents = courses?.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0) || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your courses and track performance</p>
        </div>
        <Link href="/teacher/courses/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/teacher/courses">
          <Card className="cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-blue-500">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/students">
          <Card className="cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-blue-500">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/revenue">
          <Card className="cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-blue-500">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${revenue?.netRevenue?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-muted-foreground">Net Revenue</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/revenue">
          <Card className="cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-blue-500">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{revenue?.totalTransactions || 0}</p>
                <p className="text-sm text-muted-foreground">Sales</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Courses</h2>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="space-y-3">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">{course.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                          {course.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {course._count?.enrollments || 0} students
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/teacher/courses/${course.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No courses yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first course and start sharing your knowledge
              </p>
              <Link href="/teacher/courses/new">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create Course
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <RoleProtectedRoute allowedRoles={['TEACHER']}>
      <TeacherDashboardContent />
    </RoleProtectedRoute>
  );
}
