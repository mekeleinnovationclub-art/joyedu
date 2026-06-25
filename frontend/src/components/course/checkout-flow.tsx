'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useCheckout, useValidateCoupon } from '@/hooks/use-checkout';
import { useCourse } from '@/hooks/use-courses';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, Smartphone, Tag, CheckCircle2, 
  Loader2, AlertCircle, ArrowRight
} from 'lucide-react';

interface CheckoutFlowProps {
  courseId: string;
  accessToken?: string;
  onComplete?: (transactionId: string) => void;
  onCancel?: () => void;
}

export function CheckoutFlow({ courseId, accessToken, onComplete, onCancel }: CheckoutFlowProps) {
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'card'>('telebirr');

  const { data: course, isLoading } = useCourse(courseId);

  const checkoutMutation = useCheckout();
  const validateCouponMutation = useValidateCoupon();

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;

    validateCouponMutation.mutate(
      { code: couponCode, courseId },
      {
        onSuccess: (response: any) => {
          if (response.valid) {
            setDiscount(response.discount);
            setCouponError('');
          } else {
            setCouponError(response.message || 'Invalid coupon');
            setDiscount(0);
          }
        },
        onError: () => {
          setCouponError('Failed to validate coupon');
          setDiscount(0);
        },
      }
    );
  };

  const handleCheckout = () => {
    checkoutMutation.mutate(
      { courseId, couponCode: couponCode || undefined, paymentMethod },
      {
        onSuccess: (response) => {
          if (onComplete) {
            onComplete(response.transactionId);
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const finalPrice = course.discountPrice || course.price;
  const discountedPrice = discount > 0 ? finalPrice - (finalPrice * discount / 100) : finalPrice;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Checkout</h2>
        <p className="text-muted-foreground">Complete your enrollment</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Course Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Course Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold">{course.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Original Price</span>
                <span>${course.price.toFixed(2)}</span>
              </div>
              {course.discountPrice && (
                <div className="flex justify-between text-sm">
                  <span>Discount Price</span>
                  <span className="text-green-600">${course.discountPrice.toFixed(2)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Coupon Discount ({discount}%)</span>
                  <span className="text-green-600">-${(finalPrice * discount / 100).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${discountedPrice.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Coupon */}
            <div className="space-y-2">
              <Label htmlFor="coupon">Coupon Code</Label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={validateCouponMutation.isPending}
                >
                  {validateCouponMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
              {couponError && (
                <p className="text-sm text-destructive">{couponError}</p>
              )}
              {discount > 0 && (
                <p className="text-sm text-green-600">
                  <CheckCircle2 className="h-3 w-3 inline mr-1" />
                  Coupon applied successfully!
                </p>
              )}
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('telebirr')}
                  className={`flex items-center gap-3 p-4 border rounded-lg text-left ${
                    paymentMethod === 'telebirr' ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <Smartphone className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Telebirr</p>
                    <p className="text-sm text-muted-foreground">Pay with Telebirr</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center gap-3 p-4 border rounded-lg text-left ${
                    paymentMethod === 'card' ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-muted-foreground">Pay with card</p>
                  </div>
                </button>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <>
                    Pay ${discountedPrice.toFixed(2)}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={onCancel}
                disabled={checkoutMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
