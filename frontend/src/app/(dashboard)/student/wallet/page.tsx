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
import { Wallet, ArrowUp, ArrowDown, History, Loader2 } from 'lucide-react';
import { RoleProtectedRoute } from '@/components/common/route-guards';

function WalletContent() {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [topupAmount, setTopupAmount] = useState('');
  const [topupTitle, setTopupTitle] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [topupDialogOpen, setTopupDialogOpen] = useState(false);
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

  const topupMutation = useMutation({
    mutationFn: (data: { amount: number; title?: string }) => {
      console.log('Topup Payload:', data);
      return walletApi.topup(data, accessToken || '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      setTopupDialogOpen(false);
      setTopupAmount('');
      setTopupTitle('');
    },
    onError: (error) => {
      console.error('Topup Error:', error);
    },
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

  const handleTopup = () => {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) return;
    topupMutation.mutate({ amount, title: topupTitle || 'Wallet Topup' });
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!withdrawPhone) return;
    withdrawMutation.mutate({ amount, phoneNumber: withdrawPhone, reason: withdrawReason });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground mt-1">Manage your wallet balance and transactions</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Current Balance</p>
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

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Dialog open={topupDialogOpen} onOpenChange={setTopupDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-24 flex-col gap-2 text-lg">
              <ArrowUp className="h-6 w-6" />
              Top Up
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Top Up Wallet</DialogTitle>
              <DialogDescription>Add funds to your wallet via Telebirr</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="topup-amount">Amount (ETB)</Label>
                <Input
                  id="topup-amount"
                  type="number"
                  placeholder="100"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="topup-title">Title (Optional)</Label>
                <Input
                  id="topup-title"
                  placeholder="Wallet Topup"
                  value={topupTitle}
                  onChange={(e) => setTopupTitle(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleTopup} 
                disabled={topupMutation.isPending}
                className="w-full"
              >
                {topupMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Continue to Telebirr
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-24 flex-col gap-2 text-lg">
              <ArrowDown className="h-6 w-6" />
              Withdraw
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw Funds</DialogTitle>
              <DialogDescription>Withdraw funds from your wallet to your bank account</DialogDescription>
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
      </div>

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
    <RoleProtectedRoute allowedRoles={['STUDENT']}>
      <WalletContent />
    </RoleProtectedRoute>
  );
}
