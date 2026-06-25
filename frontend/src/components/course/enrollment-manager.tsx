'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCourseEnrollments, useDeleteEnrollment } from '@/hooks/use-enrollments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, Trash2, Search, Loader2, TrendingUp, 
  CheckCircle2, Clock, GraduationCap
} from 'lucide-react';

interface EnrollmentManagerProps {
  courseId: string;
  accessToken?: string;
}

export function EnrollmentManager({ courseId, accessToken }: EnrollmentManagerProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: enrollments, isLoading } = useCourseEnrollments(courseId);

  const deleteEnrollmentMutation = useDeleteEnrollment();

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this enrollment?')) {
      deleteEnrollmentMutation.mutate(id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['enrollments', 'course', courseId] });
        },
      });
    }
  };

  const filteredEnrollments = enrollments?.filter(enrollment =>
    enrollment.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedCount = enrollments?.filter(e => e.completedAt).length || 0;
  const inProgressCount = enrollments?.filter(e => !e.completedAt && e.progress > 0).length || 0;
  const notStartedCount = enrollments?.filter(e => e.progress === 0).length || 0;

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
          <h2 className="text-2xl font-bold">Enrollment Management</h2>
          <p className="text-muted-foreground">Manage student enrollments for this course</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Graduates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">Active learners</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Enrollments List */}
      <div className="space-y-3">
        {filteredEnrollments?.map((enrollment) => (
          <Card key={enrollment.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Student #{enrollment.userId.slice(0, 8)}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                    {enrollment.lastAccessedAt && (
                      <span>• Last accessed {new Date(enrollment.lastAccessedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  {enrollment.completedAt ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : enrollment.progress > 0 ? (
                    <Badge variant="secondary">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {enrollment.progress.toFixed(0)}%
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Not Started
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(enrollment.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!filteredEnrollments || filteredEnrollments.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No enrollments found' : 'No enrollments yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
