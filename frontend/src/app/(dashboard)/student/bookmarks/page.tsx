'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark } from 'lucide-react';
import Link from 'next/link';

export default function StudentBookmarks() {
  const { accessToken } = useAuth();

  const { data: bookmarks, isLoading, error } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.get<any[]>('/bookmarks', { token: accessToken || undefined }),
    enabled: !!accessToken,
    retry: 1,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bookmarks</h1>
        <p className="text-muted-foreground mt-1">Your bookmarked courses and lessons</p>
      </div>

      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : bookmarks && bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarks.map((bookmark: any) => (
              <Link key={bookmark.id} href={`/courses/${bookmark.course?.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <h3 className="font-medium">{bookmark.course?.title || 'Course'}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {bookmark.lesson?.title || 'Bookmarked item'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No bookmarks yet</h3>
              <p className="text-sm text-muted-foreground">
                Bookmark courses and lessons to find them easily later
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
