'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BookOpen, Search, MoreHorizontal, Edit, Trash2, Flag, Eye, EyeOff } from 'lucide-react';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AdminCourses() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('none');
  const [popularitySort, setPopularitySort] = useState('none');
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', price: '' });
  const [flaggedCourses, setFlaggedCourses] = useState<Set<string>>(new Set());

  const { data: coursesResponse, isLoading, error } = useQuery<PaginatedResponse<any>>({
    queryKey: ['admin-courses', searchQuery, statusFilter, priceSort, popularitySort],
    queryFn: () => {
      let url = '/admin/courses?page=1&limit=20';
      if (searchQuery) url += `&search=${searchQuery}`;
      if (statusFilter === 'flagged') url += `&flagged=true`;
      else if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      return api.get(url, { token: accessToken || undefined });
    },
    enabled: !!accessToken,
    retry: 1,
  });

  const courses = coursesResponse?.data || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/admin/courses/${id}`, data, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setEditDialogOpen(false);
      setEditingCourse(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/admin/courses/${id}`, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/courses/${id}`, { status }, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });

  const handleEditCourse = (course: any) => {
    // Navigate to the full course builder instead of opening a simple modal
    window.location.href = `/teacher/courses/${course.id}`;
  };

  const handleDeleteCourse = (course: any) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (courseToDelete) {
      deleteMutation.mutate(courseToDelete.id);
    }
  };

  const handleTogglePublish = (course: any) => {
    const newStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    togglePublishMutation.mutate({
      id: course.id,
      status: newStatus,
    });
  };

  const handleToggleFlag = (courseId: string) => {
    setFlaggedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const filteredCourses = courses.filter((course: any) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'flagged' && !flaggedCourses.has(course.id)) return false;
      if (statusFilter !== 'flagged' && course.status !== statusFilter) return false;
    }
    return true;
  });

  const sortedCourses = [...filteredCourses].sort((a: any, b: any) => {
    if (priceSort === 'high') {
      return b.price - a.price;
    } else if (priceSort === 'low') {
      return a.price - b.price;
    }
    if (popularitySort === 'high') {
      return (b._count?.enrollments || 0) - (a._count?.enrollments || 0);
    } else if (popularitySort === 'low') {
      return (a._count?.enrollments || 0) - (b._count?.enrollments || 0);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground mt-1">Manage all platform courses</p>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Search courses..." 
            className="max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={() => window.location.href = '/teacher/courses/new'}>
            <BookOpen className="mr-2 h-4 w-4" />
            Add Course
          </Button>
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
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="price-sort">Sort by Price:</Label>
          <Select value={priceSort} onValueChange={setPriceSort}>
            <SelectTrigger id="price-sort" className="w-[180px]">
              <SelectValue placeholder="Price Sort" />
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
              <SelectValue placeholder="Popularity Sort" />
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
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : Array.isArray(sortedCourses) && sortedCourses.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Courses ({coursesResponse?.meta?.total || sortedCourses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedCourses.map((course: any) => (
                <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{course.title}</h3>
                        {flaggedCourses.has(course.id) && (
                          <Badge variant="destructive" className="text-xs">
                            <Flag className="h-3 w-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        By {course.instructor?.username || 'Unknown'} • {course._count?.enrollments || 0} students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                      {course.status}
                    </Badge>
                    <p className="text-sm font-medium">${course.price}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCourse(course)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePublish(course)}>
                          {course.status === 'PUBLISHED' ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFlag(course.id)}>
                          <Flag className="h-4 w-4 mr-2" />
                          {flaggedCourses.has(course.id) ? 'Unflag Course' : 'Flag Course'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteCourse(course)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground">
              Courses will appear here when instructors create them
            </p>
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
              and all associated content and enrollments.
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
