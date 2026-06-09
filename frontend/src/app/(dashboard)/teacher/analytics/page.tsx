'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, DollarSign, Eye, BookOpen, Download, Activity } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TeacherAnalytics() {
  const { accessToken } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState('line');
  const [isLive, setIsLive] = useState(true);

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['instructor-analytics', timeRange],
    queryFn: () =>
      api.get<{
        overview: {
          totalStudents: number;
          totalRevenue: number;
          totalEnrollments: number;
          totalCourses: number;
        };
        courseStats: {
          courseId: string;
          enrollments: number;
          revenue: number;
        }[];
        recentEnrollments: any[];
        performanceData: {
          date: string;
          quizAvg: number;
          watchTime: number;
        }[];
        completionData: {
          name: string;
          value: number;
        }[];
      }>('/analytics/instructor', { token: accessToken || undefined }),
    enabled: !!accessToken,
    retry: 1,
    refetchInterval: isLive ? 10000 : false,
  });

  const handleExport = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Date,Quiz Average,Watch Time\n' +
      (analytics?.performanceData || []).map(d => `${d.date},${d.quizAvg},${d.watchTime}`).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'analytics.csv');
    link.click();
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const overview = analytics?.overview;
  const performanceData = analytics?.performanceData || [];
  const completionData = analytics?.completionData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Analytics</h1>
          {isLive && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">Track your course performance</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="time-range">Time Range:</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger id="time-range" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="semester">Current Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="chart-type">Chart Type:</Label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger id="chart-type" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="table">Raw Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={() => setIsLive(!isLive)}>
            <Activity className="h-4 w-4 mr-2" />
            {isLive ? 'Pause' : 'Resume'}
          </Button>
        </div>

        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overview?.totalStudents || 0}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overview?.totalEnrollments || 0}</p>
              <p className="text-sm text-muted-foreground">Enrollments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${overview?.totalRevenue?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-muted-foreground">Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overview?.totalCourses || 0}</p>
              <p className="text-sm text-muted-foreground">Total Courses</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'line' ? (
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="quizAvg" stroke="#3b82f6" name="Quiz Avg" />
                  <Line type="monotone" dataKey="watchTime" stroke="#10b981" name="Watch Time" />
                </LineChart>
              ) : chartType === 'area' ? (
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="quizAvg" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Quiz Avg" />
                  <Area type="monotone" dataKey="watchTime" stackId="2" stroke="#10b981" fill="#10b981" name="Watch Time" />
                </AreaChart>
              ) : chartType === 'bar' ? (
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quizAvg" fill="#3b82f6" name="Quiz Avg" />
                  <Bar dataKey="watchTime" fill="#10b981" name="Watch Time" />
                </BarChart>
              ) : (
                <div className="space-y-2">
                  {performanceData.map((d, i) => (
                    <div key={i} className="flex justify-between p-2 border rounded">
                      <span>{d.date}</span>
                      <span>Quiz: {d.quizAvg}% | Watch: {d.watchTime}m</span>
                    </div>
                  ))}
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Completion Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {analytics?.recentEnrollments && analytics.recentEnrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentEnrollments.map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{enrollment.user.firstName} {enrollment.user.lastName}</p>
                    <p className="text-sm text-muted-foreground">{enrollment.user.email} • {enrollment.course.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(enrollment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
