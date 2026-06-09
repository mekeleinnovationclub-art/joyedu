'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BookOpen, PlusCircle, Edit, Trash2, MoreHorizontal, Eye, Send, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import type { Course } from '@/types';

export default function TeacherCourses() {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('none');
  const [popularitySort, setPopularitySort] = useState('none');
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () =>
      api.get<Course[]>('/courses/instructor/my-courses', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  const deleteMutation = useMutation({
    mutationFn: (courseId: string) =>
      api.delete(`/courses/${courseId}`, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ courseId, status }: { courseId: string; status: string }) =>
      api.patch(`/courses/${courseId}`, { status }, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    },
  });

  const handleDelete = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (courseToDelete) {
      deleteMutation.mutate(courseToDelete.id);
    }
  };

  const handleTogglePublish = (course: Course) => {
    const newStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    togglePublishMutation.mutate({ courseId: course.id, status: newStatus });
  };

  const handleSubmitForReview = (course: Course) => {
    togglePublishMutation.mutate({ courseId: course.id, status: 'UNDER_REVIEW' });
  };

  const filteredAndSortedCourses = () => {
    let result = Array.isArray(courses) ? [...courses] : [];

    if (searchQuery) {
      result = result.filter((c) =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (priceSort === 'high') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (priceSort === 'low') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    }

    if (popularitySort === 'high') {
      result.sort((a, b) => (b._count?.enrollments || 0) - (a._count?.enrollments || 0));
    } else if (popularitySort === 'low') {
      result.sort((a, b) => (a._count?.enrollments || 0) - (b._count?.enrollments || 0));
    }

    return result;
  };

  const isCourseAuthor = (course: Course) => {
    return course.instructorId === user?.id;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground mt-1">Manage your course content</p>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Search courses..." 
            className="max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Link href="/teacher/courses/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Course
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter">Filter by Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="price-sort">Sort by Price:</Label>
          <Select value={priceSort} onValueChange={setPriceSort}>
            <SelectTrigger id="price-sort" className="w-[180px]">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="high">High to Low</SelectItem>
              <SelectItem value="low">Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="popularity-sort">Sort by Popularity:</Label>
          <Select value={popularitySort} onValueChange={setPopularitySort}>
            <SelectTrigger id="popularity-sort" className="w-[180px]">
              <SelectValue placeholder="Popularity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="high">Most Popular</SelectItem>
              <SelectItem value="low">Least Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : filteredAndSortedCourses().length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCourses().map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{course._count?.enrollments || 0} students enrolled</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>${course.price}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link href={`/teacher/courses/${course.id}`} className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isCourseAuthor(course) && (
                          <DropdownMenuItem asChild>
                            <Link href={`/teacher/courses/${course.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Curriculum
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleTogglePublish(course)}>
                          {course.status === 'PUBLISHED' ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        {course.status === 'DRAFT' && (
                          <DropdownMenuItem onClick={() => handleSubmitForReview(course)}>
                            <Send className="h-4 w-4 mr-2" />
                            Submit for Review
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(course)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first course and start sharing your knowledge
            </p>
            <Link href="/teacher/courses/new">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Course
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Delete Course Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course
              and all associated content including lessons, enrollments, and progress data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
