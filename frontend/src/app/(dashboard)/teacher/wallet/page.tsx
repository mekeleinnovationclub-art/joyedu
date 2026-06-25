'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { walletApi, type WalletBalance, type Withdrawal } from '@/lib/wallet-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wallet, ArrowDown, History, Loader2, TrendingUp } from 'lucide-react';
import { RoleProtectedRoute } from '@/components/common/route-guards';

function WalletContent() {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  const { data: balance, isLoading: balanceLoading, error: balanceError } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletApi.getBalance(accessToken || ''),
    enabled: !!accessToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: withdrawals, isLoading: withdrawalsLoading, error: withdrawalsError } = useQuery({
    queryKey: ['wallet-withdrawals'],
    queryFn: () => walletApi.getWithdrawals(accessToken || ''),
    enabled: !!accessToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: { amount: number; phoneNumber: string; reason?: string }) =>
      walletApi.withdraw(data, accessToken || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-withdrawals'] });
      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      setWithdrawPhone('');
      setWithdrawReason('');
    },
  });

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!withdrawPhone) return;
    withdrawMutation.mutate({ amount, phoneNumber: withdrawPhone, reason: withdrawReason });
  };

  const totalWithdrawn = withdrawals?.withdrawals
    ?.filter(w => w.status === 'COMPLETED')
    ?.reduce((sum, w) => sum + w.amount, 0) || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground mt-1">Manage your earnings and withdrawals</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Available Balance</p>
              {balanceLoading ? (
                <Loader2 className="h-8 w-8 animate-spin mt-2" />
              ) : (
                <p className="text-4xl font-bold mt-2">
                  {balance?.balance.toFixed(2)} {balance?.currency}
                </p>
              )}
            </div>
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
              <Wallet className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalWithdrawn.toFixed(2)} ETB</p>
              <p className="text-sm text-muted-foreground">Total Withdrawn</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <History className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{withdrawals?.withdrawals?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total Withdrawals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Button */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full h-16 text-lg">
            <ArrowDown className="h-5 w-5 mr-2" />
            Withdraw Funds
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Earnings</DialogTitle>
            <DialogDescription>Withdraw your earnings to your bank account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="withdraw-amount">Amount (ETB)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="100"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: {balance?.balance.toFixed(2)} ETB
              </p>
            </div>
            <div>
              <Label htmlFor="withdraw-phone">Phone Number</Label>
              <Input
                id="withdraw-phone"
                placeholder="+251911234567"
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="withdraw-reason">Reason (Optional)</Label>
              <Textarea
                id="withdraw-reason"
                placeholder="Reason for withdrawal"
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleWithdraw} 
              disabled={withdrawMutation.isPending}
              className="w-full"
            >
              {withdrawMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Withdraw
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Withdrawal History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawalsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : withdrawals?.withdrawals && withdrawals.withdrawals.length > 0 ? (
            <div className="space-y-4">
              {withdrawals.withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{withdrawal.amount.toFixed(2)} {withdrawal.currency}</p>
                    <p className="text-sm text-muted-foreground">{withdrawal.phoneNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    withdrawal.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    withdrawal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    withdrawal.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {withdrawal.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No withdrawal history</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function WalletPage() {
  return (
    <RoleProtectedRoute allowedRoles={['TEACHER']}>
      <WalletContent />
    </RoleProtectedRoute>
  );
}
