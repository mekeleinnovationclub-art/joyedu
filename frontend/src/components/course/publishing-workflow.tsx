'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, XCircle, AlertTriangle, Loader2, 
  Eye, Rocket, BookOpen, Layers, FileText, HelpCircle,
  Dumbbell, FolderOpen, Link, Image, Megaphone, Tag
} from 'lucide-react';

interface PublishingWorkflowProps {
  courseId: string;
  accessToken?: string;
  onPublish?: () => void;
  onCancel?: () => void;
}

const noop = () => {};

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  stats: {
    topics: number;
    subtopics: number;
    lessons: number;
  };
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  categoryId?: string;
  learningGoals?: string[];
  status: string;
}

export function PublishingWorkflow({ courseId, accessToken, onPublish, onCancel }: PublishingWorkflowProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'validation' | 'review' | 'publishing' | 'success'>('validation');

  const { data: course, isLoading: loadingCourse } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  const { data: validation, isLoading: loadingValidation } = useQuery<ValidationResult>({
    queryKey: ['course-validation', courseId],
    queryFn: () => api.get(`/course-structure/courses/${courseId}/validate`, { token: accessToken }),
    enabled: !!courseId && !!accessToken && step === 'validation',
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      api.patch(`/courses/${courseId}/publish`, { status: 'PUBLISHED' }, { token: accessToken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setStep('success');
      onPublish?.();
    },
  });

  const handlePublish = () => {
    setStep('publishing');
    publishMutation.mutate();
  };

  const isLoading = loadingCourse || loadingValidation;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (step === 'validation') {
    return <ValidationStep course={course} validation={validation} onNext={() => setStep('review')} onCancel={onCancel || noop} />;
  }

  if (step === 'review') {
    return <ReviewStep course={course} validation={validation} onPublish={handlePublish} onBack={() => setStep('validation')} onCancel={onCancel || noop} />;
  }

  if (step === 'publishing') {
    return <PublishingStep courseId={courseId} accessToken={accessToken} />;
  }

  if (step === 'success') {
    return <SuccessStep onDone={onCancel || noop} />;
  }

  return null;
}

interface ValidationStepProps {
  course?: Course;
  validation?: ValidationResult;
  onNext: () => void;
  onCancel: () => void;
}

function ValidationStep({ course, validation, onNext, onCancel }: ValidationStepProps) {
  const checks = [
    { id: 'title', label: 'Course Title', passed: !!course?.title, icon: BookOpen },
    { id: 'description', label: 'Course Description', passed: !!course?.description, icon: FileText },
    { id: 'thumbnail', label: 'Course Thumbnail', passed: !!course?.thumbnail, icon: Image },
    { id: 'category', label: 'Course Category', passed: !!course?.categoryId, icon: Tag },
    { id: 'goals', label: 'Learning Goals', passed: (course?.learningGoals?.length || 0) > 0, icon: CheckCircle2 },
    { id: 'topics', label: 'Course Topics', passed: (validation?.stats.topics || 0) > 0, icon: Layers },
    { id: 'subtopics', label: 'Course Subtopics', passed: (validation?.stats.subtopics || 0) > 0, icon: Layers },
    { id: 'lessons', label: 'Course Lessons', passed: (validation?.stats.lessons || 0) > 0, icon: FileText },
  ];

  const allPassed = checks.every((check) => check.passed);
  const passedCount = checks.filter((check) => check.passed).length;
  const progress = (passedCount / checks.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Publishing Validation</h2>
          <p className="text-muted-foreground">Check if your course is ready to publish</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onNext} disabled={!allPassed}>
            Review Course
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Validation Progress</span>
              <span className="text-sm text-muted-foreground">{passedCount}/{checks.length} checks passed</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {/* Validation Checks */}
      <div className="space-y-3">
        {checks.map((check) => {
          const Icon = check.icon;
          return (
            <Card key={check.id} className={check.passed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${check.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Icon className={`h-5 w-5 ${check.passed ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{check.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {check.passed ? 'Completed' : 'Missing'}
                    </p>
                  </div>
                </div>
                {check.passed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Validation Errors */}
      {validation && !validation.isValid && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-2">Validation Errors</h4>
              <ul className="list-disc list-inside text-sm text-red-800">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Course Stats */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Course Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{validation.stats.topics}</p>
                <p className="text-sm text-muted-foreground">Topics</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{validation.stats.subtopics}</p>
                <p className="text-sm text-muted-foreground">Subtopics</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{validation.stats.lessons}</p>
                <p className="text-sm text-muted-foreground">Lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ReviewStepProps {
  course?: Course;
  validation?: ValidationResult;
  onPublish: () => void;
  onBack: () => void;
  onCancel: () => void;
}

function ReviewStep({ course, validation, onPublish, onBack, onCancel }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review Course</h2>
          <p className="text-muted-foreground">Review your course before publishing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onPublish}>
            <Rocket className="h-4 w-4 mr-2" />
            Publish Course
          </Button>
        </div>
      </div>

      {/* Course Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Course Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            {course?.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="h-32 w-32 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{course?.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{course?.description}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Learning Goals</p>
              <p className="font-medium">{course?.learningGoals?.length || 0} goals</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={course?.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                {course?.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Structure Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Course Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{validation?.stats.topics || 0}</p>
              <p className="text-sm text-muted-foreground">Topics</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{validation?.stats.subtopics || 0}</p>
              <p className="text-sm text-muted-foreground">Subtopics</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{validation?.stats.lessons || 0}</p>
              <p className="text-sm text-muted-foreground">Lessons</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Course information is complete</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Course structure is valid</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Learning goals are defined</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Course thumbnail is set</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Warning */}
      <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900 mb-1">Before Publishing</h4>
            <p className="text-sm text-yellow-800">
              Once published, your course will be visible to all students. Make sure you have reviewed all content and settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PublishingStepProps {
  courseId: string;
  accessToken?: string;
}

function PublishingStep({ courseId, accessToken }: PublishingStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Publishing Your Course</h2>
        <p className="text-muted-foreground">Please wait while we publish your course...</p>
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>Validating course structure</span>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Publishing course content</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
          <span>Making course visible to students</span>
        </div>
      </div>
    </div>
  );
}

interface SuccessStepProps {
  onDone: () => void;
}

function SuccessStep({ onDone }: SuccessStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Course Published!</h2>
        <p className="text-muted-foreground">Your course is now live and visible to students.</p>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={onDone}>
          <Eye className="h-4 w-4 mr-2" />
          View Course
        </Button>
        <Button onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
