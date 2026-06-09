'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, DollarSign, Users, TrendingUp, BarChart3, Shield } from 'lucide-react';
import { RoleProtectedRoute } from '@/components/common/route-guards';
import Link from 'next/link';

function AdminDashboardContent() {
  const { accessToken } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () =>
      api.get<{
        totalUsers: number;
        totalCourses: number;
        totalEnrollments: number;
        totalRevenue: number;
        totalTransactions: number;
      }>('/admin/dashboard', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () =>
      api.get<{
        last30Days: {
          newUsers: number;
          newEnrollments: number;
          revenue: number;
          transactions: number;
        };
      }>('/admin/analytics', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });


  if (isLoading) {
    return (
      <div className="space-y-8">
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Platform overview and management</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/admin/users">
            <Card className="transition-all duration-200 cursor-pointer hover:bg-slate-50 hover:border-blue-500">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                  <p className="text-sm text-muted-foreground">Users</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/courses">
            <Card className="transition-all duration-200 cursor-pointer hover:bg-slate-50 hover:border-blue-500">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalCourses || 0}</p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/analytics">
            <Card className="transition-all duration-200 cursor-pointer hover:bg-slate-50 hover:border-blue-500">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalEnrollments || 0}</p>
                  <p className="text-sm text-muted-foreground">Enrollments</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/payouts">
            <Card className="transition-all duration-200 cursor-pointer hover:bg-slate-50 hover:border-blue-500">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/payouts">
            <Card className="transition-all duration-200 cursor-pointer hover:bg-slate-50 hover:border-blue-500">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalTransactions || 0}</p>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {analytics && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Last 30 Days</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/users">
              <Card className="transition-all duration-200 cursor-pointer hover:bg-slate-50 hover:border-blue-500">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-blue-500">{analytics.last30Days.newUsers}</p>
                  <p className="text-sm text-muted-foreground mt-1">New Users</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/analytics">
              <Card className="transition-all duration-200 cursor-pointer hover:bg-slate-50 hover:border-blue-500">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-green-500">{analytics.last30Days.newEnrollments}</p>
                  <p className="text-sm text-muted-foreground mt-1">New Enrollments</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/payouts">
              <Card className="transition-all duration-200 cursor-pointer hover:bg-slate-50 hover:border-blue-500">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-orange-500">${analytics.last30Days.revenue.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Revenue</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/payouts">
              <Card className="transition-all duration-200 cursor-pointer hover:bg-slate-50 hover:border-blue-500">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-purple-500">{analytics.last30Days.transactions}</p>
                  <p className="text-sm text-muted-foreground mt-1">Transactions</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <RoleProtectedRoute allowedRoles={['ADMIN']}>
      <AdminDashboardContent />
    </RoleProtectedRoute>
  );
}
