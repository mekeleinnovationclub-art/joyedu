'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet, Users, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { RoleProtectedRoute } from '@/components/common/route-guards';

interface WalletStats {
  totalBalance: number;
  totalUsers: number;
  totalWithdrawals: number;
  totalTopups: number;
}

function WalletContent() {
  const { accessToken } = useAuth();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-wallet-stats'],
    queryFn: () => api.get<WalletStats>('/admin/wallet/stats', { token: accessToken || undefined }),
    enabled: !!accessToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Wallet Management</h1>
        <p className="text-muted-foreground mt-1">Overview of wallet system statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : error ? (
                <>
                  <p className="text-2xl font-bold">N/A</p>
                  <p className="text-sm text-muted-foreground">Error loading</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold">{stats?.totalBalance.toFixed(2)} ETB</p>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : error ? (
                <>
                  <p className="text-2xl font-bold">N/A</p>
                  <p className="text-sm text-muted-foreground">Error loading</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold">{stats?.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : error ? (
                <>
                  <p className="text-2xl font-bold">N/A</p>
                  <p className="text-sm text-muted-foreground">Error loading</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold">{stats?.totalTopups.toFixed(2)} ETB</p>
                  <p className="text-sm text-muted-foreground">Total Topups</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : error ? (
                <>
                  <p className="text-2xl font-bold">N/A</p>
                  <p className="text-sm text-muted-foreground">Error loading</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold">{stats?.totalWithdrawals.toFixed(2)} ETB</p>
                  <p className="text-sm text-muted-foreground">Total Withdrawals</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Features</CardTitle>
            <CardDescription>Available wallet functionality for users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Wallet Balance</p>
                <p className="text-sm text-muted-foreground">Users can view their current wallet balance in ETB</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Top Up</p>
                <p className="text-sm text-muted-foreground">Users can add funds via Telebirr payment gateway</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded bg-orange-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">Withdraw</p>
                <p className="text-sm text-muted-foreground">Users can withdraw funds to their phone number via B2C disbursement</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Course Payment</p>
                <p className="text-sm text-muted-foreground">Users can pay for courses using their wallet balance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Status</CardTitle>
            <CardDescription>Withdrawal processing states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div>
                <p className="font-medium">Pending</p>
                <p className="text-sm text-muted-foreground">Withdrawal request submitted, awaiting processing</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <div>
                <p className="font-medium">Processing</p>
                <p className="text-sm text-muted-foreground">Withdrawal is being processed by Telebirr</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div>
                <p className="font-medium">Completed</p>
                <p className="text-sm text-muted-foreground">Withdrawal successfully completed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div>
                <p className="font-medium">Failed</p>
                <p className="text-sm text-muted-foreground">Withdrawal failed, funds refunded to wallet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <RoleProtectedRoute allowedRoles={['ADMIN']}>
      <WalletContent />
    </RoleProtectedRoute>
  );
}
