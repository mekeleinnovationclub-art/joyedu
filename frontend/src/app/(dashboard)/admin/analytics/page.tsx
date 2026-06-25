'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, DollarSign, BookOpen, Download, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminAnalytics() {
  const { accessToken } = useAuth();
  const [timeRange, setTimeRange] = useState('30days');
  const [chartType, setChartType] = useState('line');
  const [isLive, setIsLive] = useState(true);

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard', timeRange],
    queryFn: () =>
      api.get<{
        totalUsers: number;
        totalCourses: number;
        totalEnrollments: number;
        totalRevenue: number;
        totalTransactions: number;
      }>(`/admin/dashboard?timeRange=${timeRange}`, { token: accessToken || undefined }),
    enabled: !!accessToken,
    refetchInterval: isLive ? 5000 : false,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<{
    last30Days: {
      newUsers: number;
      newEnrollments: number;
      revenue: number;
      transactions: number;
    };
    chartData: Array<{
      name: string;
      revenue: number;
      enrollments: number;
    }>;
  }>({
    queryKey: ['admin-analytics', timeRange],
    queryFn: () => api.get(`/admin/analytics?timeRange=${timeRange}`, { token: accessToken || undefined }),
    enabled: !!accessToken,
    retry: 1,
    refetchInterval: isLive ? 5000 : false,
  });

  const isLoading = statsLoading || analyticsLoading;

  const chartData = analytics?.chartData || [];

  const pieData = [
    { name: 'Students', value: dashboardStats?.totalUsers ? Math.floor(dashboardStats.totalUsers * 0.7) : 400 },
    { name: 'Teachers', value: dashboardStats?.totalUsers ? Math.floor(dashboardStats.totalUsers * 0.3) : 150 },
  ];

  const COLORS = ['#3b82f6', '#10b981'];

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Time,Revenue,Enrollments\n"
      + chartData.map(row => `${row.name},${row.revenue},${row.enrollments}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "analytics_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Analytics</h1>
          {isLive && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full relative"></div>
              </div>
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24hours">Last 24 Hours</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              Line
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              Bar
            </Button>
            <Button
              variant={chartType === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('table')}
            >
              Table
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground">Platform performance metrics</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dashboardStats?.totalUsers || 0}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dashboardStats?.totalCourses || 0}</p>
              <p className="text-sm text-muted-foreground">Total Courses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${dashboardStats?.totalRevenue?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dashboardStats?.totalEnrollments || 0}</p>
              <p className="text-sm text-muted-foreground">Enrollments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Enrollments Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {chartType === 'line' ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} name="Revenue ($)" />
                    <Line yAxisId="right" type="monotone" dataKey="enrollments" stroke="#10b981" strokeWidth={2} name="Enrollments" />
                  </LineChart>
                </ResponsiveContainer>
              ) : chartType === 'bar' ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#8b5cf6" name="Revenue ($)" />
                    <Bar yAxisId="right" dataKey="enrollments" fill="#10b981" name="Enrollments" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Time</th>
                        <th className="text-right p-2">Revenue ($)</th>
                        <th className="text-right p-2">Enrollments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{row.name}</td>
                          <td className="text-right p-2">${row.revenue}</td>
                          <td className="text-right p-2">{row.enrollments}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Last 30 Days Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">New Users</p>
              <p className="text-2xl font-bold text-blue-600">{analytics?.last30Days?.newUsers || 0}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">New Enrollments</p>
              <p className="text-2xl font-bold text-green-600">{analytics?.last30Days?.newEnrollments || 0}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold text-purple-600">${analytics?.last30Days?.revenue?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold text-orange-600">{analytics?.last30Days?.transactions || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
