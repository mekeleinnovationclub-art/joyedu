'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { 
  PlusCircle, Trash2, Edit2, Tag, Percent, Clock, 
  Loader2, CheckCircle, XCircle, Copy
} from 'lucide-react';

interface CouponManagerProps {
  courseId: string;
  accessToken?: string;
}

interface Coupon {
  id: string;
  code: string;
  discount: number;
  isPercent: boolean;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  courseId?: string;
  isActive: boolean;
  createdAt: string;
}

export function CouponManager({ courseId, accessToken }: CouponManagerProps) {
  const queryClient = useQueryClient();
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ['coupons', courseId],
    queryFn: () => api.get(`/coupons/course/${courseId}`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['coupons', courseId] });
  };

  const createCouponMutation = useMutation({
    mutationFn: (data: Partial<Coupon>) =>
      api.post('/coupons', { courseId, ...data }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const updateCouponMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Coupon> }) =>
      api.put(`/coupons/${id}`, data, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/coupons/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No expiry';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.expiresAt) return false;
    return new Date(coupon.expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Coupons & Promotions</h2>
          <p className="text-muted-foreground">Create discount coupons and promotional offers</p>
        </div>
        <Button onClick={() => setEditingCoupon({ code: '', discount: 0, isPercent: true, isActive: true } as Coupon)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Coupons List */}
      <div className="space-y-4">
        {coupons?.map((coupon) => (
          <Card key={coupon.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-lg">{coupon.code}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyCode(coupon.code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant={coupon.isPercent ? 'default' : 'secondary'}>
                      {coupon.isPercent ? <Percent className="h-3 w-3 mr-1" /> : <span className="mr-1">$</span>}
                      {coupon.discount}{coupon.isPercent ? '%' : ''}
                    </Badge>
                    {coupon.isActive ? (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                    {isExpired(coupon) && (
                      <Badge variant="destructive">
                        <Clock className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {coupon.maxUses && (
                      <span>{coupon.usedCount}/{coupon.maxUses} uses</span>
                    )}
                    <span>Expires: {formatDate(coupon.expiresAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditingCoupon(coupon)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteCouponMutation.mutate(coupon.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!coupons || coupons.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No coupons yet</p>
              <Button onClick={() => setEditingCoupon({ code: '', discount: 0, isPercent: true, isActive: true } as Coupon)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create First Coupon
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Coupon Editor Dialog */}
      <Dialog open={!!editingCoupon} onOpenChange={() => setEditingCoupon(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCoupon?.id ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
            <DialogDescription>
              {editingCoupon?.id ? 'Edit the coupon details below.' : 'Create a new discount coupon for your course.'}
            </DialogDescription>
          </DialogHeader>
          {editingCoupon && (
            <CouponEditor
              coupon={editingCoupon}
              onSave={(data) => {
                if (editingCoupon.id) {
                  updateCouponMutation.mutate({ id: editingCoupon.id, data });
                } else {
                  createCouponMutation.mutate(data);
                }
                setEditingCoupon(null);
              }}
              onCancel={() => setEditingCoupon(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CouponEditorProps {
  coupon: Coupon;
  onSave: (data: Partial<Coupon>) => void;
  onCancel: () => void;
}

function CouponEditor({ coupon, onSave, onCancel }: CouponEditorProps) {
  const [code, setCode] = useState(coupon.code);
  const [discount, setDiscount] = useState(coupon.discount);
  const [isPercent, setIsPercent] = useState(coupon.isPercent);
  const [maxUses, setMaxUses] = useState(coupon.maxUses?.toString() || '');
  const [expiresAt, setExpiresAt] = useState(coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '');
  const [isActive, setIsActive] = useState(coupon.isActive);

  const handleSave = () => {
    onSave({
      code: code.toUpperCase(),
      discount: Math.round(discount),
      isPercent,
      maxUses: maxUses ? parseInt(maxUses) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="couponCode">Coupon Code</Label>
        <Input
          id="couponCode"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="SAVE20"
          className="font-mono uppercase"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="discount">Discount Amount (integer)</Label>
          <Input
            id="discount"
            type="number"
            value={discount}
            onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
            min={0}
            step={1}
          />
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Switch
            id="isPercent"
            checked={isPercent}
            onCheckedChange={setIsPercent}
          />
          <Label htmlFor="isPercent">Percentage Discount</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxUses">Max Uses (Optional)</Label>
        <Input
          id="maxUses"
          type="number"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          min={1}
          placeholder="No limit"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
        <Input
          id="expiresAt"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}
