'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { TeacherRoute } from '@/components/auth/route-guard';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateCourseDto, CourseValidation } from '@/types/api-contracts';

type DraftState = 'idle' | 'creating' | 'ready' | 'error';

export default function NewCourse() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const hasCreatedRef = useRef(false);
  const [draftState, setDraftState] = useState<DraftState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const createDraft = async () => {
    setDraftState('creating');
    setErrorMessage('');

    try {
      // Use the API contract type and validation helper
      const courseData: CreateCourseDto = CourseValidation.createMinimalDto(
        'Untitled Course',
        'Course description'
      );

      // Validate before sending
      const validation = CourseValidation.validateCreateCourseDto(courseData);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const result = await api.post<{ id: string }>('/courses', courseData, { token: accessToken || undefined });
      setDraftState('ready');
      // Redirect to edit route immediately after draft creation
      router.replace(`/teacher/courses/${result.id}/edit`);
    } catch (error: any) {
      setDraftState('error');
      setErrorMessage(error?.message || 'Failed to create draft. Please try again.');
    }
  };

  // Create draft immediately on mount with React Strict Mode protection
  useEffect(() => {
    if (!accessToken || hasCreatedRef.current || draftState !== 'idle') return;

    hasCreatedRef.current = true;
    createDraft();
  }, [accessToken, draftState]);

  const handleRetry = () => {
    hasCreatedRef.current = false;
    setDraftState('idle');
  };

  return (
    <TeacherRoute>
      <div className="flex items-center justify-center min-h-[400px]">
        {draftState === 'creating' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Creating draft course...</p>
          </div>
        )}

        {draftState === 'error' && (
          <Card className="max-w-md w-full border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button
                onClick={handleRetry}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TeacherRoute>
  );
}
