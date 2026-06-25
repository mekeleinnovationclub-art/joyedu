'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { MultiStepCourseBuilder } from '@/components/course/multi-step-course-builder';
import { TeacherRoute } from '@/components/auth/route-guard';
import { useParams } from 'next/navigation';
import { useCourse } from '@/hooks/use-courses';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditCourse() {
  const router = useRouter();
  const params = useParams();
  const { accessToken } = useAuth();
  const courseId = params.id as string;

  const { data: course, isLoading, error, refetch } = useCourse(courseId, { token: accessToken || undefined });

  const handleSave = (courseId: string) => {
    // Navigate to course detail page after successful publish
    router.push(`/teacher/courses/${courseId}`);
  };

  const handleCancel = () => {
    // Navigate back to courses list
    router.push('/teacher/courses');
  };

  const handleRetry = () => {
    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <TeacherRoute>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading course...</p>
          </div>
        </div>
      </TeacherRoute>
    );
  }

  // Error state
  if (error) {
    const isNotFound = (error as any)?.response?.status === 404;
    const isForbidden = (error as any)?.response?.status === 403;

    return (
      <TeacherRoute>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {isNotFound ? 'Course Not Found' : isForbidden ? 'Access Denied' : 'Error'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isNotFound
                  ? 'The course you are trying to edit does not exist or has been deleted.'
                  : isForbidden
                  ? 'You do not have permission to edit this course.'
                  : 'Failed to load course. Please try again.'}
              </p>
              <Button onClick={handleRetry} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={handleCancel} variant="ghost" className="w-full">
                Back to Courses
              </Button>
            </CardContent>
          </Card>
        </div>
      </TeacherRoute>
    );
  }

  // Course loaded successfully
  return (
    <TeacherRoute>
      <MultiStepCourseBuilder
        courseId={courseId}
        accessToken={accessToken || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </TeacherRoute>
  );
}
