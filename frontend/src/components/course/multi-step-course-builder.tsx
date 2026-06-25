'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { api } from '@/lib/api';
import { useAutosave } from '@/hooks/use-autosave';
import { useCourse, useUpdateCourse } from '@/hooks/use-courses';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, ChevronRight, CheckCircle2, Circle, 
  BookOpen, Target, Layers, FileText, HelpCircle, 
  Dumbbell, FolderOpen, Link, Image, Megaphone, 
  Tag, Eye, Save, Loader2 
} from 'lucide-react';
import { CurriculumBuilder } from './curriculum-builder';
import { LessonBuilder } from './lesson-builder';
import { QuizBuilder } from './quiz-builder';
import { ExerciseBuilder } from './exercise-builder';
import { ResourceManager } from './resource-manager';
import { PrerequisiteManager } from './prerequisite-manager';
import { MediaGallery } from './media-gallery';
import { AnnouncementManager } from './announcement-manager';
import { CouponManager } from './coupon-manager';
import { PublishingWorkflow } from './publishing-workflow';
import { CoursePreview } from './course-preview';
import { DIFFICULTY_LEVELS, CreateCourseDto, UpdateCourseDto, CourseValidation } from '@/types/api-contracts';

const courseBasicsSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subtitle: z.string().optional(),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  shortDescription: z.string().optional(),
  thumbnail: z.string().url().optional().or(z.literal('')),
  coverImage: z.string().url().optional().or(z.literal('')),
  previewVideo: z.string().url().optional().or(z.literal('')),
  promotionalVideo: z.string().url().optional().or(z.literal('')),
  price: z.string(),
  discountPrice: z.string().optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  categoryId: z.string().optional(),
  language: z.string().default('en'),
  duration: z.string(),
  tags: z.array(z.string()).default([]),
});

const learningOutcomesSchema = z.object({
  requirements: z.array(z.string()).default([]),
  learningGoals: z.array(z.string()).min(1, 'At least one learning goal is required'),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).default([]),
  certificateEligible: z.boolean().default(false),
});

type CourseBasicsForm = z.infer<typeof courseBasicsSchema>;
type LearningOutcomesForm = z.infer<typeof learningOutcomesSchema>;

interface MultiStepCourseBuilderProps {
  courseId?: string;
  accessToken?: string;
  onSave?: (courseId: string) => void;
  onCancel?: () => void;
}

const STEPS = [
  { id: 'basics', title: 'Course Basics', icon: BookOpen },
  { id: 'outcomes', title: 'Learning Outcomes', icon: Target },
  { id: 'structure', title: 'Course Structure', icon: Layers },
  { id: 'lessons', title: 'Lesson Builder', icon: FileText },
  { id: 'quizzes', title: 'Quiz Builder', icon: HelpCircle },
  { id: 'exercises', title: 'Exercise Builder', icon: Dumbbell },
  { id: 'resources', title: 'Resources', icon: FolderOpen },
  { id: 'prerequisites', title: 'Prerequisites', icon: Link },
  { id: 'media', title: 'Media Gallery', icon: Image },
  { id: 'announcements', title: 'Announcements', icon: Megaphone },
  { id: 'coupons', title: 'Coupons', icon: Tag },
  { id: 'preview', title: 'Preview', icon: Eye },
  { id: 'publish', title: 'Publish', icon: CheckCircle2 },
] as const;

export function MultiStepCourseBuilder({ courseId, accessToken, onSave, onCancel }: MultiStepCourseBuilderProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const hasHydratedRef = useRef(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const courseBasicsForm = useForm<CourseBasicsForm>({
    resolver: zodResolver(courseBasicsSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      description: '',
      shortDescription: '',
      thumbnail: '',
      coverImage: '',
      previewVideo: '',
      promotionalVideo: '',
      price: '0',
      discountPrice: '0',
      difficulty: 'BEGINNER',
      language: 'en',
      duration: '0',
      tags: [],
    },
  });

  const learningOutcomesForm = useForm<LearningOutcomesForm>({
    resolver: zodResolver(learningOutcomesSchema),
    defaultValues: {
      requirements: [],
      learningGoals: [],
      seoKeywords: [],
      certificateEligible: false,
    },
  });

  // Autosave logic
  const currentFormData = {
    ...courseBasicsForm.getValues(),
    ...learningOutcomesForm.getValues(),
  };

  const { saveNow: autosaveNow, isSaving: autosaveSaving, saveError: autosaveError } = useAutosave({
    data: currentFormData,
    onSave: async (data) => {
      if (!autosaveEnabled || !courseId) return;
      // Filter to only include valid UpdateCourseDto fields (status is allowed in updates)
      const courseData = CourseValidation.filterToValidCreateCourseDto(data);
      await api.put(`/courses/${courseId}`, courseData, { token: accessToken });
      // Invalidate cache after successful autosave to prevent stale data
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
    delay: 5000, // Autosave every 5 seconds
    enabled: autosaveEnabled && !!accessToken && !!courseId,
    maxRetries: 2,
  });

  // Fetch existing course data if editing
  const { data: existingCourse, isLoading } = useCourse(courseId || '', { token: accessToken });

  // Populate forms with existing course data when editing (only once per course load)
  useEffect(() => {
    if (existingCourse && courseId && !hasHydratedRef.current) {
      courseBasicsForm.reset({
        title: existingCourse.title || '',
        subtitle: existingCourse.subtitle || '',
        description: existingCourse.description || '',
        shortDescription: existingCourse.shortDescription || '',
        thumbnail: existingCourse.thumbnail || '',
        coverImage: existingCourse.coverImage || '',
        previewVideo: existingCourse.previewVideo || '',
        promotionalVideo: existingCourse.promotionalVideo || '',
        price: existingCourse.price?.toString() || '0',
        discountPrice: existingCourse.discountPrice?.toString() || '0',
        difficulty: existingCourse.difficulty || 'BEGINNER',
        categoryId: existingCourse.categoryId || '',
        language: existingCourse.language || 'en',
        duration: existingCourse.duration?.toString() || '0',
        tags: existingCourse.tags || [],
      });

      learningOutcomesForm.reset({
        requirements: existingCourse.requirements || [],
        learningGoals: existingCourse.learningGoals || [],
        seoTitle: (existingCourse as any).seoTitle || '',
        seoDescription: (existingCourse as any).seoDescription || '',
        seoKeywords: (existingCourse as any).seoKeywords || [],
        certificateEligible: existingCourse.certificateEligible || false,
      });

      hasHydratedRef.current = true;
    }
  }, [existingCourse, courseId, courseBasicsForm, learningOutcomesForm]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories', { token: accessToken }),
    enabled: !!accessToken,
  });

  // Save course mutation using dedicated hooks
  const updateCourseMutation = useUpdateCourse();

  const saveCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!courseId) {
        throw new Error('Course ID is required for saving');
      }
      return updateCourseMutation.mutateAsync({ id: courseId, data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setIsSaving(false);
    },
    onError: (error) => {
      setIsSaving(false);
      setValidationErrors([(error as Error).message || 'Failed to save course']);
    },
  });

  // Validate course for publishing
  const validateCourseMutation = useMutation<ValidationResult, Error, string>({
    mutationFn: (id: string) => 
      api.get(`/course-structure/courses/${id}/validate`, { token: accessToken }),
  });

  // Publish course mutation
  const publishCourseMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/courses/${id}/publish`, {}, { token: accessToken }),
    onMutate: () => {
      setIsPublishing(true);
      setPublishError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setIsPublishing(false);
      // Call onSave only after successful publish to allow parent to navigate
      if (onSave && courseId) {
        onSave(courseId);
      }
    },
    onError: (error) => {
      setIsPublishing(false);
      setPublishError((error as Error).message || 'Failed to publish course');
    },
  });

  interface ValidationResult {
    isValid: boolean;
    errors: string[];
    stats: {
      topics: number;
      subtopics: number;
      lessons: number;
    };
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    setCompletedSteps((prev) => new Set(Array.from(prev).concat(currentStep)));
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    setValidationErrors([]);
    
    switch (STEPS[currentStep].id) {
      case 'basics':
        const basicsValid = await courseBasicsForm.trigger();
        if (!basicsValid) {
          setValidationErrors(['Please fix the errors in the form']);
          return false;
        }
        break;
      case 'outcomes':
        const outcomesValid = await learningOutcomesForm.trigger();
        if (!outcomesValid) {
          setValidationErrors(['Please fix the errors in the form']);
          return false;
        }
        break;
      case 'publish':
        if (courseId) {
          const validation = await validateCourseMutation.mutateAsync(courseId);
          if (!validation.isValid) {
            setValidationErrors(validation.errors);
            return false;
          }
        }
        break;
    }
    
    return true;
  };

  const handleSave = async () => {
    setIsSaving(true);
    const basicsData = courseBasicsForm.getValues();
    const outcomesData = learningOutcomesForm.getValues();
    
    // Combine form data and filter to only valid UpdateCourseDto fields
    const courseData = CourseValidation.filterToValidCreateCourseDto({
      ...basicsData,
      ...outcomesData,
    });

    // Validate before sending
    const validation = CourseValidation.validateCreateCourseDto(courseData);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      setIsSaving(false);
      return;
    }

    saveCourseMutation.mutate(courseData);
  };

  const handlePublish = async () => {
    if (!courseId || isPublishing) return;

    const isValid = await validateCurrentStep();
    if (!isValid) return;

    publishCourseMutation.mutate(courseId);
  };

  const progress = ((completedSteps.size + 1) / STEPS.length) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {courseId ? 'Edit Course' : 'Create New Course'}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Draft
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Step Indicators */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[80px] transition-colors ${
                  isCurrent ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                <span className="text-xs font-medium">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <ul className="list-disc list-inside text-red-800">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StepIcon className="h-6 w-6" />
            {STEPS[currentStep].title}
          </CardTitle>
          <CardDescription>
            {getStepDescription(STEPS[currentStep].id)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={STEPS[currentStep].id} className="w-full">
            <TabsContent value="basics">
              <CourseBasicsStep 
                form={courseBasicsForm} 
                categories={categories}
                existingData={existingCourse}
              />
            </TabsContent>
            
            <TabsContent value="outcomes">
              <LearningOutcomesStep 
                form={learningOutcomesForm}
                existingData={existingCourse}
              />
            </TabsContent>

            <TabsContent value="structure">
              <CourseStructureStep courseId={courseId} accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="lessons">
              <LessonBuilderStep courseId={courseId} accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="quizzes">
              <QuizBuilderStep courseId={courseId} accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="exercises">
              <ExerciseBuilderStep courseId={courseId} accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="resources">
              <ResourcesStep courseId={courseId} accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="prerequisites">
              <PrerequisitesStep courseId={courseId} accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="media">
              <MediaGalleryStep courseId={courseId} accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="announcements">
              <AnnouncementsStep courseId={courseId} accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="coupons">
              <CouponsStep courseId={courseId} accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="preview">
              <CoursePreviewStep courseId={courseId} accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="publish">
              <PublishStep courseId={courseId} accessToken={accessToken} onPublish={handlePublish} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep === STEPS.length - 1 ? (
          <Button onClick={handlePublish} disabled={publishCourseMutation.isPending}>
            {publishCourseMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Publish Course
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

function getStepDescription(stepId: string): string {
  const descriptions: Record<string, string> = {
    basics: 'Enter the basic information about your course including title, description, and pricing.',
    outcomes: 'Define what students will learn and the requirements for taking this course.',
    structure: 'Build your course curriculum with topics, subtopics, and lessons.',
    lessons: 'Create detailed lesson content with various content blocks.',
    quizzes: 'Add quizzes to test student knowledge and track progress.',
    exercises: 'Create hands-on exercises for practical learning.',
    resources: 'Upload and manage course resources and materials.',
    prerequisites: 'Set required courses that students must complete before this one.',
    media: 'Manage images, videos, and other media for your course.',
    announcements: 'Create announcements to communicate with enrolled students.',
    coupons: 'Create discount coupons and promotional offers.',
    preview: 'Preview your course before publishing.',
    publish: 'Review and publish your course to make it available to students.',
  };
  return descriptions[stepId] || '';
}

// Step Components
function CourseBasicsStep({ form, categories, existingData }: any) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Course Title *</Label>
          <Input
            id="title"
            {...form.register('title')}
            placeholder="Introduction to Web Development"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            {...form.register('subtitle')}
            placeholder="A comprehensive guide for beginners"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Course Description *</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Describe what students will learn in this course..."
          rows={6}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortDescription">Short Description</Label>
        <Textarea
          id="shortDescription"
          {...form.register('shortDescription')}
          placeholder="A brief summary for course cards..."
          rows={3}
        />
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...form.register('price')}
            placeholder="99.99"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountPrice">Discount Price ($)</Label>
          <Input
            id="discountPrice"
            type="number"
            step="0.01"
            {...form.register('discountPrice')}
            placeholder="49.99"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select onValueChange={(value) => form.setValue('difficulty', value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Input
            id="language"
            {...form.register('language')}
            placeholder="en"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            {...form.register('duration')}
            placeholder="1200"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <Select onValueChange={(value) => form.setValue('categoryId', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="thumbnail">Thumbnail URL</Label>
        <Input
          id="thumbnail"
          {...form.register('thumbnail')}
          placeholder="https://example.com/thumbnail.jpg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverImage">Cover Image URL</Label>
        <Input
          id="coverImage"
          {...form.register('coverImage')}
          placeholder="https://example.com/cover.jpg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="previewVideo">Preview Video URL</Label>
        <Input
          id="previewVideo"
          {...form.register('previewVideo')}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="promotionalVideo">Promotional Video URL</Label>
        <Input
          id="promotionalVideo"
          {...form.register('promotionalVideo')}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>
    </div>
  );
}

function LearningOutcomesStep({ form, existingData }: any) {
  const [requirementInput, setRequirementInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const requirements = form.watch('requirements') || [];
  const learningGoals = form.watch('learningGoals') || [];
  const seoKeywords = form.watch('seoKeywords') || [];

  const addRequirement = () => {
    if (requirementInput.trim()) {
      form.setValue('requirements', [...requirements, requirementInput.trim()]);
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    form.setValue('requirements', requirements.filter((_: string, i: number) => i !== index));
  };

  const addGoal = () => {
    if (goalInput.trim()) {
      form.setValue('learningGoals', [...learningGoals, goalInput.trim()]);
      setGoalInput('');
    }
  };

  const removeGoal = (index: number) => {
    form.setValue('learningGoals', learningGoals.filter((_: string, i: number) => i !== index));
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      form.setValue('seoKeywords', [...seoKeywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    form.setValue('seoKeywords', seoKeywords.filter((_: string, i: number) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Requirements</Label>
        <p className="text-sm text-muted-foreground">What students need before taking this course</p>
        <div className="flex gap-2">
          <Input
            value={requirementInput}
            onChange={(e) => setRequirementInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
            placeholder="Basic HTML knowledge"
          />
          <Button type="button" onClick={addRequirement}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {requirements.map((req: string, index: number) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {req}
              <button
                type="button"
                onClick={() => removeRequirement(index)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Learning Goals *</Label>
        <p className="text-sm text-muted-foreground">What students will learn</p>
        <div className="flex gap-2">
          <Input
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGoal()}
            placeholder="Build responsive websites"
          />
          <Button type="button" onClick={addGoal}>Add</Button>
        </div>
        {form.formState.errors.learningGoals && (
          <p className="text-sm text-destructive">{form.formState.errors.learningGoals.message}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {learningGoals.map((goal: string, index: number) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {goal}
              <button
                type="button"
                onClick={() => removeGoal(index)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="seoTitle">SEO Title</Label>
        <Input
          id="seoTitle"
          {...form.register('seoTitle')}
          placeholder="Learn Web Development - Complete Course"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="seoDescription">SEO Description</Label>
        <Textarea
          id="seoDescription"
          {...form.register('seoDescription')}
          placeholder="A comprehensive course covering HTML, CSS, and JavaScript..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>SEO Keywords</Label>
        <div className="flex gap-2">
          <Input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="web development"
          />
          <Button type="button" onClick={addKeyword}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {seoKeywords.map((keyword: string, index: number) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(index)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="certificateEligible"
          {...form.register('certificateEligible')}
          className="rounded"
        />
        <Label htmlFor="certificateEligible">Certificate Eligible</Label>
      </div>
    </div>
  );
}

// Integrated step components using existing builders
function CourseStructureStep({ courseId, accessToken }: any) {
  return <CurriculumBuilder courseId={courseId} accessToken={accessToken} />;
}

function LessonBuilderStep({ courseId, accessToken }: any) {
  return <LessonBuilderWrapper courseId={courseId} accessToken={accessToken} />;
}

function QuizBuilderStep({ courseId, accessToken }: any) {
  return <QuizBuilderWrapper courseId={courseId} accessToken={accessToken} />;
}

function ExerciseBuilderStep({ courseId, accessToken }: any) {
  return <ExerciseBuilderWrapper courseId={courseId} accessToken={accessToken} />;
}

function ResourcesStep({ courseId, accessToken }: any) {
  return <ResourceManager courseId={courseId} accessToken={accessToken} />;
}

function PrerequisitesStep({ courseId, accessToken }: any) {
  return <PrerequisiteManager courseId={courseId} accessToken={accessToken} />;
}

function MediaGalleryStep({ courseId, accessToken }: any) {
  return <MediaGallery courseId={courseId} accessToken={accessToken} />;
}

function AnnouncementsStep({ courseId, accessToken }: any) {
  return <AnnouncementManager courseId={courseId} accessToken={accessToken} />;
}

function CouponsStep({ courseId, accessToken }: any) {
  return <CouponManager courseId={courseId} accessToken={accessToken} />;
}

function CoursePreviewStep({ courseId, accessToken }: any) {
  return <CoursePreview courseId={courseId} accessToken={accessToken} />;
}

function PublishStep({ courseId, accessToken, onPublish }: any) {
  return <PublishingWorkflow courseId={courseId} accessToken={accessToken} onPublish={onPublish} />;
}

function LessonBuilderWrapper({ courseId, accessToken }: any) {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const { data: structure, isLoading } = useQuery<{ topics: any[] }>({
    queryKey: ['course-structure', courseId],
    queryFn: () => api.get(`/course-structure/courses/${courseId}/structure`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selectedLessonId) {
    return (
      <LessonBuilder 
        lessonId={selectedLessonId} 
        courseId={courseId} 
        accessToken={accessToken}
        onCancel={() => setSelectedLessonId(null)}
      />
    );
  }

  const allLessons: any[] = [];
  structure?.topics.forEach((topic: any) => {
    topic.subtopics?.forEach((subtopic: any) => {
      subtopic.lessons?.forEach((lesson: any) => {
        allLessons.push({ ...lesson, topicTitle: topic.title, subtopicTitle: subtopic.title });
      });
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select a Lesson to Edit</h3>
        <p className="text-muted-foreground mb-4">Choose a lesson from your course curriculum to edit its content</p>
      </div>

      {allLessons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No lessons yet</p>
            <p className="text-sm text-muted-foreground">Create lessons in the Course Structure step first</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {allLessons.map((lesson) => (
            <Card key={lesson.id} className="cursor-pointer hover:border-primary" onClick={() => setSelectedLessonId(lesson.id)}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {lesson.topicTitle} / {lesson.subtopicTitle}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{lesson.type}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function QuizBuilderWrapper({ courseId, accessToken }: any) {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const { data: structure, isLoading } = useQuery<{ topics: any[] }>({
    queryKey: ['course-structure', courseId],
    queryFn: () => api.get(`/course-structure/courses/${courseId}/structure`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selectedLessonId) {
    return (
      <QuizBuilder 
        lessonId={selectedLessonId} 
        courseId={courseId} 
        accessToken={accessToken}
        onCancel={() => setSelectedLessonId(null)}
      />
    );
  }

  const allLessons: any[] = [];
  structure?.topics.forEach((topic: any) => {
    topic.subtopics?.forEach((subtopic: any) => {
      subtopic.lessons?.forEach((lesson: any) => {
        allLessons.push({ ...lesson, topicTitle: topic.title, subtopicTitle: subtopic.title });
      });
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select a Lesson to Manage Quizzes</h3>
        <p className="text-muted-foreground mb-4">Choose a lesson to add or edit quizzes</p>
      </div>

      {allLessons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No lessons yet</p>
            <p className="text-sm text-muted-foreground">Create lessons in the Course Structure step first</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {allLessons.map((lesson) => (
            <Card key={lesson.id} className="cursor-pointer hover:border-primary" onClick={() => setSelectedLessonId(lesson.id)}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {lesson.topicTitle} / {lesson.subtopicTitle}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{lesson.type}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ExerciseBuilderWrapper({ courseId, accessToken }: any) {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const { data: structure, isLoading } = useQuery<{ topics: any[] }>({
    queryKey: ['course-structure', courseId],
    queryFn: () => api.get(`/course-structure/courses/${courseId}/structure`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selectedLessonId) {
    return (
      <ExerciseBuilder 
        lessonId={selectedLessonId} 
        courseId={courseId} 
        accessToken={accessToken}
        onCancel={() => setSelectedLessonId(null)}
      />
    );
  }

  const allLessons: any[] = [];
  structure?.topics.forEach((topic: any) => {
    topic.subtopics?.forEach((subtopic: any) => {
      subtopic.lessons?.forEach((lesson: any) => {
        allLessons.push({ ...lesson, topicTitle: topic.title, subtopicTitle: subtopic.title });
      });
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select a Lesson to Manage Exercises</h3>
        <p className="text-muted-foreground mb-4">Choose a lesson to add or edit exercises</p>
      </div>

      {allLessons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No lessons yet</p>
            <p className="text-sm text-muted-foreground">Create lessons in the Course Structure step first</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {allLessons.map((lesson) => (
            <Card key={lesson.id} className="cursor-pointer hover:border-primary" onClick={() => setSelectedLessonId(lesson.id)}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Dumbbell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {lesson.topicTitle} / {lesson.subtopicTitle}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{lesson.type}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
