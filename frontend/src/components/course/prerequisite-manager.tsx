'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  PlusCircle, Trash2, Link as LinkIcon, BookOpen, 
  Loader2, CheckCircle, XCircle
} from 'lucide-react';

interface PrerequisiteManagerProps {
  courseId: string;
  accessToken?: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  difficulty: string;
}

interface Prerequisite {
  id: string;
  courseId: string;
  prerequisiteId: string;
  prerequisite: Course;
}

export function PrerequisiteManager({ courseId, accessToken }: PrerequisiteManagerProps) {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data: prerequisites, isLoading: loadingPrereqs } = useQuery<Prerequisite[]>({
    queryKey: ['prerequisites', courseId],
    queryFn: () => api.get(`/course-prerequisites/course/${courseId}`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  const { data: availableCourses, isLoading: loadingAvailable } = useQuery<Course[]>({
    queryKey: ['available-courses', courseId],
    queryFn: () => api.get(`/course-prerequisites/available/${courseId}`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['prerequisites', courseId] });
    queryClient.invalidateQueries({ queryKey: ['available-courses', courseId] });
  };

  const addPrerequisiteMutation = useMutation({
    mutationFn: (prerequisiteId: string) =>
      api.post('/course-prerequisites', { courseId, prerequisiteId }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const removePrerequisiteMutation = useMutation({
    mutationFn: (prerequisiteId: string) =>
      api.post('/course-prerequisites/remove', { courseId, prerequisiteId }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const isLoading = loadingPrereqs || loadingAvailable;

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
          <h2 className="text-2xl font-bold">Course Prerequisites</h2>
          <p className="text-muted-foreground">Set required courses students must complete first</p>
        </div>
      </div>

      {/* Current Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Current Prerequisites
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prerequisites && prerequisites.length > 0 ? (
            <div className="space-y-2">
              {prerequisites.map((prereq) => (
                <div key={prereq.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {prereq.prerequisite.thumbnail && (
                      <img
                        src={prereq.prerequisite.thumbnail}
                        alt={prereq.prerequisite.title}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{prereq.prerequisite.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{prereq.prerequisite.difficulty}</Badge>
                        <span>{prereq.prerequisite.slug}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePrerequisiteMutation.mutate(prereq.prerequisiteId)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No prerequisites set yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Available Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableCourses && availableCourses.length > 0 ? (
            <div className="space-y-2">
              {availableCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {course.thumbnail && (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{course.difficulty}</Badge>
                        <span>{course.slug}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addPrerequisiteMutation.mutate(course.id)}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No available courses to add as prerequisites</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
