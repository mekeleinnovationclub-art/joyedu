'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TeacherRevenue() {
  const { accessToken } = useAuth();

  const { data: revenue, isLoading, error } = useQuery({
    queryKey: ['instructor-revenue'],
    queryFn: () =>
      api.get<{
        totalRevenue: number;
        netRevenue: number;
        platformFee: number;
        totalTransactions: number;
      }>('/payments/revenue', { token: accessToken || undefined }),
    enabled: !!accessToken,
    retry: 1,
  });

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
        <div>
          <h1 className="text-3xl font-bold">Revenue</h1>
          <p className="text-muted-foreground mt-1">Track your earnings and payouts</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${revenue?.totalRevenue?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${revenue?.netRevenue?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-muted-foreground">Net Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${revenue?.platformFee?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-muted-foreground">Platform Fee</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{revenue?.totalTransactions || 0}</p>
              <p className="text-sm text-muted-foreground">Transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Total Revenue</p>
                <p className="text-sm text-muted-foreground">Gross revenue from all sales</p>
              </div>
              <p className="text-lg font-semibold text-green-600">${revenue?.totalRevenue?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Platform Fee</p>
                <p className="text-sm text-muted-foreground">Platform commission</p>
              </div>
              <p className="text-lg font-semibold text-orange-600">${revenue?.platformFee?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Net Revenue</p>
                <p className="text-sm text-muted-foreground">Your earnings after fees</p>
              </div>
              <p className="text-lg font-semibold text-blue-600">${revenue?.netRevenue?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
