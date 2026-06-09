'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AdminPayouts() {
  const { accessToken } = useAuth();

  const { data: payoutsResponse, isLoading, error } = useQuery<PaginatedResponse<any>>({
    queryKey: ['admin-payouts'],
    queryFn: () => api.get('/admin/payouts?page=1&limit=20', { token: accessToken || undefined }),
    enabled: !!accessToken,
    retry: 1,
  });

  const payouts = payoutsResponse?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payouts</h1>
          <p className="text-muted-foreground mt-1">Manage instructor payouts</p>
        </div>
        <Button>Process Pending</Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : Array.isArray(payouts) && payouts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Payouts ({payoutsResponse?.meta?.total || payouts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payouts.map((payout: any) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">{payout.instructor?.username || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payout.periodStart).toLocaleDateString()} - {new Date(payout.periodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold">${payout.amount?.toFixed(2) || '0.00'}</p>
                      <Badge variant={getStatusColor(payout.status)} className="gap-1">
                        {getStatusIcon(payout.status)}
                        {payout.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No payouts yet</h3>
            <p className="text-muted-foreground">
              Payouts will appear here when instructors earn revenue
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
