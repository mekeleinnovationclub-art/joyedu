'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, DollarSign, TrendingUp, BookOpen, Star, Clock,
  Award, Target, BarChart3, LineChart
} from 'lucide-react';

interface InstructorDashboardProps {
  courseId: string;
  accessToken?: string;
}

interface DashboardStats {
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  totalEnrollments: number;
  activeStudents: number;
  certificateIssued: number;
}

interface CourseAnalytics {
  enrollmentsOverTime: { date: string; count: number }[];
  revenueOverTime: { date: string; amount: number }[];
  completionByTopic: { topic: string; completed: number; total: number }[];
  studentEngagement: { lesson: string; views: number; completion: number }[];
}

interface Course {
  id: string;
  title: string;
  description?: string;
  price?: number;
}

export function InstructorDashboard({ courseId, accessToken }: InstructorDashboardProps) {
  const { data: stats, isLoading: loadingStats } = useQuery<DashboardStats>({
    queryKey: ['course-stats', courseId],
    queryFn: () => api.get(`/analytics/course/${courseId}/stats`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery<CourseAnalytics>({
    queryKey: ['course-analytics', courseId],
    queryFn: () => api.get(`/analytics/course/${courseId}/analytics`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  const { data: course } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  const isLoading = loadingStats || loadingAnalytics;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Instructor Dashboard</h2>
        <p className="text-muted-foreground">{course?.title || 'Course'} Performance Overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={Users}
          trend="+12%"
          trendUp
        />
        <MetricCard
          title="Total Revenue"
          value={`$${(stats?.totalRevenue || 0).toFixed(2)}`}
          icon={DollarSign}
          trend="+8%"
          trendUp
        />
        <MetricCard
          title="Average Rating"
          value={stats?.averageRating?.toFixed(1) || '0.0'}
          icon={Star}
          suffix="/ 5.0"
          trend="+0.2"
          trendUp
        />
        <MetricCard
          title="Completion Rate"
          value={`${(stats?.completionRate || 0).toFixed(1)}%`}
          icon={Target}
          trend="+5%"
          trendUp
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats?.activeStudents || 0}</span>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Certificates Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats?.certificateIssued || 0}</span>
              <Award className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats?.totalEnrollments || 0}</span>
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="enrollments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="completion">Completion</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Enrollments Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/50">
                <div className="text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Enrollment chart visualization</p>
                  <p className="text-xs text-muted-foreground">Data available: {analytics?.enrollmentsOverTime?.length || 0} data points</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/50">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Revenue chart visualization</p>
                  <p className="text-xs text-muted-foreground">Data available: {analytics?.revenueOverTime?.length || 0} data points</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Completion by Topic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.completionByTopic?.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.topic}</span>
                      <span className="text-muted-foreground">{item.completed}/{item.total}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(item.completed / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!analytics?.completionByTopic || analytics.completionByTopic.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No completion data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Student Engagement by Lesson
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.studentEngagement?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.lesson}</p>
                      <p className="text-xs text-muted-foreground">{item.views} views</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.completion.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">completion</p>
                    </div>
                  </div>
                ))}
                {(!analytics?.studentEngagement || analytics.studentEngagement.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No engagement data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  suffix?: string;
  trend?: string;
  trendUp?: boolean;
}

function MetricCard({ title, value, icon: Icon, suffix, trend, trendUp }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold">{value}</span>
            {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
          </div>
          {trend && (
            <Badge variant={trendUp ? 'default' : 'destructive'} className="text-xs">
              {trend}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
