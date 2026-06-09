'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Loader2, Home } from 'lucide-react';

type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export default function TelebirrPaymentStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const merchantOrderId = searchParams.get('merchantOrderId');

  const [status, setStatus] = useState<PaymentStatus>('PROCESSING');

  // Poll payment status
  const { data: paymentStatus, isLoading } = useQuery({
    queryKey: ['telebirr-status', merchantOrderId],
    queryFn: () => api.get<{ status: PaymentStatus; telebirrStatus: string; amount: string }>(`/payments/telebirr/status/${merchantOrderId}`),
    enabled: !!merchantOrderId && !!accessToken,
    refetchInterval: (data: any) => {
      // Stop polling if payment is completed or failed
      if (data?.status === 'COMPLETED' || data?.status === 'FAILED' || data?.status === 'CANCELLED') {
        return false;
      }
      return 3000;
    },
  });

  useEffect(() => {
    if (paymentStatus) {
      setStatus(paymentStatus.status);
      if (paymentStatus.status === 'COMPLETED') {
        // Redirect to course after successful payment
        setTimeout(() => {
          router.push('/student/courses');
        }, 3000);
      }
    }
  }, [paymentStatus, router]);

  const getStatusContent = () => {
    switch (status) {
      case 'COMPLETED':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          title: 'Payment Successful!',
          description: 'You have been enrolled in the course. Redirecting to your courses...',
          bgColor: 'bg-green-50',
        };
      case 'FAILED':
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: 'Payment Failed',
          description: 'Your payment could not be processed. Please try again.',
          bgColor: 'bg-red-50',
        };
      case 'CANCELLED':
        return {
          icon: <XCircle className="h-16 w-16 text-gray-500" />,
          title: 'Payment Cancelled',
          description: 'You cancelled the payment. You can try again anytime.',
          bgColor: 'bg-gray-50',
        };
      case 'PROCESSING':
      case 'PENDING':
        return {
          icon: <Clock className="h-16 w-16 text-yellow-500 animate-pulse" />,
          title: 'Processing Payment',
          description: 'Please wait while we confirm your payment status...',
          bgColor: 'bg-yellow-50',
        };
      default:
        return {
          icon: <XCircle className="h-16 w-16 text-gray-500" />,
          title: 'Payment Status Unknown',
          description: 'Unable to determine payment status. Please contact support.',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const content = getStatusContent();

  if (!merchantOrderId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Invalid Request</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Missing payment order ID. Please try purchasing again.</p>
                <Button onClick={() => router.push('/student/courses')} className="w-full">
                  Go to My Courses
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="max-w-md mx-auto">
          <Card className={content.bgColor}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {isLoading ? <Loader2 className="h-16 w-16 animate-spin text-primary" /> : content.icon}
              </div>
              <CardTitle className="text-2xl">{content.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-muted-foreground">{content.description}</p>

              {status === 'FAILED' && (
                <Button onClick={() => router.back()} className="w-full">
                  Try Again
                </Button>
              )}

              {(status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/student/courses')}
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to My Courses
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
