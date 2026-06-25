'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { 
  PlusCircle, Trash2, Edit2, Dumbbell, CheckCircle, 
  Loader2, Lightbulb, FileCode
} from 'lucide-react';

interface ExerciseBuilderProps {
  lessonId: string;
  courseId: string;
  accessToken?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface Exercise {
  id: string;
  title: string;
  description?: string;
  hints?: string[];
  solution?: string;
  fileUrl?: string;
}

export function ExerciseBuilder({ lessonId, courseId, accessToken, onSave, onCancel }: ExerciseBuilderProps) {
  const queryClient = useQueryClient();
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deleteExercise, setDeleteExercise] = useState<{ id: string; title: string } | null>(null);

  const { data: exercises, isLoading, refetch } = useQuery<Exercise[]>({
    queryKey: ['exercises', lessonId],
    queryFn: () => api.get(`/exercises/lesson/${lessonId}`, { token: accessToken }),
    enabled: !!lessonId && !!accessToken,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['exercises', lessonId] });
    queryClient.invalidateQueries({ queryKey: ['course-structure', courseId] });
  };

  const createExerciseMutation = useMutation({
    mutationFn: (data: Partial<Exercise>) =>
      api.post('/exercises', { lessonId, ...data }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const updateExerciseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Exercise> }) =>
      api.patch(`/exercises/${id}`, data, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/exercises/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

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
          <h2 className="text-2xl font-bold">Exercise Builder</h2>
          <p className="text-muted-foreground">Create hands-on exercises for practical learning</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => setEditingExercise({ id: crypto.randomUUID(), title: '', hints: [], solution: '' } as Exercise)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Exercise
          </Button>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {exercises?.map((exercise) => (
          <Card key={exercise.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  <span className="font-medium">{exercise.title}</span>
                  {exercise.hints && exercise.hints.length > 0 && (
                    <Badge variant="outline">{exercise.hints.length} hints</Badge>
                  )}
                  {exercise.fileUrl && (
                    <Badge variant="outline">Has file</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditingExercise(exercise)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteExercise({ id: exercise.id, title: exercise.title })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {exercise.description && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{exercise.description}</p>
              </CardContent>
            )}
          </Card>
        ))}

        {(!exercises || exercises.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No exercises yet for this lesson</p>
              <Button onClick={() => setEditingExercise({ id: crypto.randomUUID(), title: '', hints: [], solution: '' } as Exercise)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create First Exercise
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Exercise Editor Dialog */}
      <Dialog open={!!editingExercise} onOpenChange={() => setEditingExercise(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingExercise?.id ? 'Edit Exercise' : 'Create Exercise'}</DialogTitle>
            <DialogDescription>
              {editingExercise?.id ? 'Edit the exercise details below.' : 'Create a new coding exercise for this lesson.'}
            </DialogDescription>
          </DialogHeader>
          {editingExercise && (
            <ExerciseEditor
              exercise={editingExercise}
              onSave={(data) => {
                if (editingExercise.id) {
                  updateExerciseMutation.mutate({ id: editingExercise.id, data });
                } else {
                  createExerciseMutation.mutate(data);
                }
                setEditingExercise(null);
              }}
              onCancel={() => setEditingExercise(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Exercise Confirmation Dialog */}
      <Dialog open={!!deleteExercise} onOpenChange={() => setDeleteExercise(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exercise</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteExercise?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteExercise(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteExercise) {
                  deleteExerciseMutation.mutate(deleteExercise.id);
                  setDeleteExercise(null);
                }
              }}
            >
              Delete Exercise
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ExerciseEditorProps {
  exercise: Exercise;
  onSave: (data: Partial<Exercise>) => void;
  onCancel: () => void;
}

function ExerciseEditor({ exercise, onSave, onCancel }: ExerciseEditorProps) {
  const [title, setTitle] = useState(exercise.title);
  const [description, setDescription] = useState(exercise.description || '');
  const [solution, setSolution] = useState(exercise.solution || '');
  const [fileUrl, setFileUrl] = useState(exercise.fileUrl || '');
  const [hints, setHints] = useState<string[]>(exercise.hints || []);
  const [newHint, setNewHint] = useState('');

  const addHint = () => {
    if (newHint.trim()) {
      setHints([...hints, newHint.trim()]);
      setNewHint('');
    }
  };

  const removeHint = (index: number) => {
    setHints(hints.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      title,
      description,
      solution,
      fileUrl,
      hints,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="exerciseTitle">Title</Label>
        <Input
          id="exerciseTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Exercise title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exerciseDescription">Description</Label>
        <Textarea
          id="exerciseDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe what students need to do..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fileUrl">File URL (Optional)</Label>
        <Input
          id="fileUrl"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="https://example.com/exercise-file.zip"
        />
      </div>

      <div className="space-y-2">
        <Label>Hints</Label>
        <p className="text-sm text-muted-foreground">Add hints to help students when they get stuck</p>
        <div className="flex gap-2">
          <Input
            value={newHint}
            onChange={(e) => setNewHint(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addHint()}
            placeholder="Hint text"
          />
          <Button type="button" onClick={addHint}>
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {hints.map((hint, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              <Lightbulb className="h-3 w-3" />
              {hint}
              <button
                type="button"
                onClick={() => removeHint(index)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="solution">Solution (Optional)</Label>
        <Textarea
          id="solution"
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          rows={6}
          placeholder="Provide the solution or answer key..."
          className="font-mono"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}
