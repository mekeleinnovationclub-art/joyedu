'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, CreditCard, Smartphone, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { RoleProtectedRoute } from '@/components/common/route-guards';

interface PaymentStats {
  totalRevenue: number;
  stripeRevenue: { amount: number; count: number };
  telebirrRevenue: { amount: number; count: number };
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  paymentMethods: Record<string, number>;
}

interface Transaction {
  id: string;
  user: { firstName: string; lastName: string; email: string };
  course: { title: string } | null;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

function AdminPaymentsContent() {
  const { accessToken } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-payment-stats'],
    queryFn: () => api.get<PaymentStats>('/admin/payments/stats', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: () => api.get<{ data: Transaction[] }>('/admin/payments/transactions', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  if (statsLoading || transactionsLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-muted-foreground mt-1">Monitor and manage all payment transactions</p>
      </div>

      {stats && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Payment Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Stripe Revenue</p>
                    <p className="text-2xl font-bold">${stats.stripeRevenue.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{stats.stripeRevenue.count} transactions</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Telebirr Revenue</p>
                    <p className="text-2xl font-bold">${stats.telebirrRevenue.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{stats.telebirrRevenue.count} transactions</p>
                  </div>
                  <Smartphone className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {((stats.successfulPayments / (stats.successfulPayments + stats.failedPayments)) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Successful</p>
                  <p className="text-lg font-bold">{stats.successfulPayments}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-lg font-bold">{stats.pendingPayments}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Failed</p>
                  <p className="text-lg font-bold">{stats.failedPayments}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-4">ID</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Course</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions?.data?.map((transaction: any) => (
                    <tr key={transaction.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 text-sm font-mono">{transaction.id.slice(0, 8)}...</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{transaction.user.firstName} {transaction.user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{transaction.user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {transaction.course ? (
                          <p className="text-sm">{transaction.course.title}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">N/A</p>
                        )}
                      </td>
                      <td className="p-4 font-medium">${Number(transaction.amount).toFixed(2)}</td>
                      <td className="p-4">
                        <Badge variant={transaction.paymentMethod === 'TELEBIRR' ? 'default' : 'secondary'}>
                          {transaction.paymentMethod}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            transaction.status === 'COMPLETED'
                              ? 'default'
                              : transaction.status === 'FAILED'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminPayments() {
  return (
    <RoleProtectedRoute allowedRoles={['ADMIN']}>
      <AdminPaymentsContent />
    </RoleProtectedRoute>
  );
}
