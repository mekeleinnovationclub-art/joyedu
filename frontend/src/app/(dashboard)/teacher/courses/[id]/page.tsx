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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BookOpen, Users, DollarSign, X, PlusCircle, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Course } from '@/types';
import { CourseBuilder } from '@/components/course/course-builder';

export default function CourseDetail() {
  const params = useParams();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const courseId = params.id as string;

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`, { token: accessToken || undefined }),
    enabled: !!courseId && !!accessToken,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    price: '0',
    difficulty: 'BEGINNER',
    language: 'en',
    requirements: [] as string[],
    learningGoals: [] as string[],
    tags: [] as string[],
  });
  const [requirementInput, setRequirementInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      api.put(`/courses/${courseId}`, {
        ...data,
        price: parseFloat(data.price) || 0,
      }, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      setIsEditing(false);
    },
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      api.post(`/courses/${courseId}/publish`, {}, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () =>
      api.post(`/courses/${courseId}/archive`, {}, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
    },
  });

  const handleEdit = () => {
    if (course) {
      setFormData({
        title: course.title,
        subtitle: course.subtitle || '',
        description: course.description,
        price: course.price?.toString() || '0',
        difficulty: course.difficulty,
        language: course.language,
        requirements: course.requirements || [],
        learningGoals: course.learningGoals || [],
        tags: course.tags || [],
      });
      setIsEditing(true);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData({ ...formData, requirements: [...formData.requirements, requirementInput.trim()] });
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({ ...formData, requirements: formData.requirements.filter((_, i) => i !== index) });
  };

  const addGoal = () => {
    if (goalInput.trim()) {
      setFormData({ ...formData, learningGoals: [...formData.learningGoals, goalInput.trim()] });
      setGoalInput('');
    }
  };

  const removeGoal = (index: number) => {
    setFormData({ ...formData, learningGoals: formData.learningGoals.filter((_, i) => i !== index) });
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <Link href="/teacher/courses">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Course not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/teacher/courses">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Course</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                      <SelectItem value="EXPERT">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  placeholder="Add a requirement"
                />
                <Button type="button" onClick={addRequirement} variant="outline">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requirements.map((req, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {req}
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                  placeholder="Add a learning goal"
                />
                <Button type="button" onClick={addGoal} variant="outline">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.learningGoals.map((goal, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {goal}
                    <button
                      type="button"
                      onClick={() => removeGoal(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/teacher/courses">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={handleEdit}>
            <Save className="h-4 w-4" />
            Edit Course
          </Button>
          {course.status === 'DRAFT' && (
            <Button
              variant="default"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              {publishMutation.isPending ? 'Publishing...' : 'Publish'}
            </Button>
          )}
          {course.status === 'PUBLISHED' && (
            <Button
              variant="outline"
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? 'Archiving...' : 'Archive'}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              {course.subtitle && (
                <p className="text-muted-foreground mt-2">{course.subtitle}</p>
              )}
            </div>
            <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
              {course.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{course.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Students</p>
                <p className="font-semibold">{course._count?.enrollments || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Reviews</p>
                <p className="font-semibold">{course._count?.reviews || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-semibold">${course.price || 'Free'}</p>
              </div>
            </div>
          </div>

          {course.requirements && course.requirements.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Requirements</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {course.requirements.map((req: string, index: number) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {course.learningGoals && course.learningGoals.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Learning Goals</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {course.learningGoals.map((goal: string, index: number) => (
                  <li key={index}>{goal}</li>
                ))}
              </ul>
            </div>
          )}

          {course.tags && course.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CourseBuilder courseId={courseId} accessToken={accessToken || undefined} />
    </div>
  );
}
