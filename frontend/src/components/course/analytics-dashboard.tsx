'use client';

import { useQuery } from '@tanstack/react-query';
import { useInstructorAnalytics } from '@/hooks/use-analytics';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, DollarSign, BookOpen, TrendingUp, 
  Award, Clock, CheckCircle2, AlertCircle 
} from 'lucide-react';

interface AnalyticsDashboardProps {
  instructorId?: string;
}

export function AnalyticsDashboard({ instructorId }: AnalyticsDashboardProps) {
  const { user } = useAuth();
  const targetInstructorId = instructorId || user?.id;

  const { data: analytics, isLoading } = useInstructorAnalytics(targetInstructorId || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">Course enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.courseStats.length > 0
                ? (analytics.courseStats.reduce((acc, curr) => acc + curr.completionRate, 0) / analytics.courseStats.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Course completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Course Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.courseStats.map((course) => (
              <div key={course.courseId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{course.courseTitle}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {course.studentCount} students
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${course.revenue.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {course.averageRating.toFixed(1)} avg
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{course.completionRate.toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground">completion</p>
                </div>
              </div>
            ))}

            {analytics.courseStats.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No course data available yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentEnrollments.slice(0, 10).map((enrollment) => (
              <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Student #{enrollment.userId.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {enrollment.completedAt ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">Completed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{enrollment.progress.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {analytics.recentEnrollments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No enrollments yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
