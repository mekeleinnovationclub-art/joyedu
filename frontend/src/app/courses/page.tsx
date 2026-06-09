'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { CourseCard } from '@/components/course/course-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import type { Course, PaginatedResponse } from '@/types';

const difficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', search, difficulty, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (difficulty) params.set('difficulty', difficulty);
      params.set('page', String(page));
      params.set('limit', '12');
      return api.get<PaginatedResponse<Course>>(`/courses?${params.toString()}`);
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Browse Courses</h1>
            <p className="text-muted-foreground mt-1">
              Discover courses to advance your skills and career
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={!difficulty ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => { setDifficulty(undefined); setPage(1); }}
              >
                All
              </Badge>
              {difficulties.map((d) => (
                <Badge
                  key={d}
                  variant={difficulty === d ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => { setDifficulty(d); setPage(1); }}
                >
                  {d}
                </Badge>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.data?.map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} />
                ))}
              </div>

              {data?.data?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No courses found. Try a different search.
                </div>
              )}

              {data?.meta && data.meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-6">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {page} of {data.meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= data.meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
