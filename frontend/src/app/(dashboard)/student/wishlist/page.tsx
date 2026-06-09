'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function StudentWishlist() {
  const { accessToken } = useAuth();

  const { data: wishlist, isLoading, error } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get<any[]>('/wishlist', { token: accessToken || undefined }),
    enabled: !!accessToken,
    retry: 1,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Wishlist</h1>
        <p className="text-muted-foreground mt-1">Courses you want to enroll in</p>
      </div>

      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : wishlist && wishlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wishlist.map((item: any) => (
              <Link key={item.id} href={`/courses/${item.course?.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <h3 className="font-medium">{item.course?.title || 'Course'}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.course?.instructor?.firstName} {item.course?.instructor?.lastName}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Your wishlist is empty</h3>
              <p className="text-sm text-muted-foreground">
                Save courses you're interested in by adding them to your wishlist
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
