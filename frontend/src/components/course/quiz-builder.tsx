'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { 
  PlusCircle, Trash2, Edit2, HelpCircle, CheckCircle, 
  Loader2, GripVertical, ChevronDown, ChevronRight
} from 'lucide-react';

const QUESTION_TYPES = [
  'MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 
  'SHORT_ANSWER', 'CODE', 'MATCHING', 'FILL_BLANK'
] as const;

interface QuizBuilderProps {
  lessonId: string;
  courseId: string;
  accessToken?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface Question {
  id: string;
  text: string;
  type: string;
  options?: Record<string, unknown>;
  correctAnswer: string;
  explanation?: string;
  points: number;
  sortOrder: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  questions: Question[];
}

export function QuizBuilder({ lessonId, courseId, accessToken, onSave, onCancel }: QuizBuilderProps) {
  const queryClient = useQueryClient();
  const [expandedQuizzes, setExpandedQuizzes] = useState<Set<string>>(new Set());
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{ quizId: string; question: Question } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteQuiz, setDeleteQuiz] = useState<{ id: string; title: string } | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<{ id: string; quizId: string; text: string } | null>(null);

  const { data: quizzes, isLoading, refetch } = useQuery<Quiz[]>({
    queryKey: ['quizzes', lessonId],
    queryFn: () => api.get(`/quizzes/lesson/${lessonId}`, { token: accessToken }),
    enabled: !!lessonId && !!accessToken,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['quizzes', lessonId] });
    queryClient.invalidateQueries({ queryKey: ['course-structure', courseId] });
  };

  const createQuizMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; passingScore?: number; timeLimit?: number }) =>
      api.post('/quizzes', { lessonId, ...data }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const updateQuizMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Quiz> }) =>
      api.patch(`/quizzes/${id}`, data, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/quizzes/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const createQuestionMutation = useMutation({
    mutationFn: ({ quizId, data }: { quizId: string; data: Partial<Question> }) =>
      api.post(`/quizzes/${quizId}/questions`, data, { token: accessToken }),
    onSuccess: invalidate,
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Question> }) =>
      api.patch(`/quizzes/questions/${id}`, data, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/quizzes/questions/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const reorderQuestionsMutation = useMutation({
    mutationFn: ({ quizId, questionIds }: { quizId: string; questionIds: string[] }) =>
      api.post('/quizzes/questions/reorder', { quizId, questionIds }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const toggleQuiz = (id: string) => {
    setExpandedQuizzes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
          <h2 className="text-2xl font-bold">Quiz Builder</h2>
          <p className="text-muted-foreground">Create quizzes to test student knowledge</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => createQuizMutation.mutate({ title: 'New Quiz', passingScore: 70 })}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
        </div>
      </div>

      {/* Quizzes List */}
      <div className="space-y-4">
        {quizzes?.map((quiz) => (
          <Card key={quiz.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    className="flex items-center gap-2 font-medium hover:text-primary"
                    onClick={() => toggleQuiz(quiz.id)}
                  >
                    {expandedQuizzes.has(quiz.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <HelpCircle className="h-4 w-4" />
                    {quiz.title}
                    <Badge variant="outline">{quiz.questions.length} questions</Badge>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditingQuiz(quiz)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteQuiz({ id: quiz.id, title: quiz.title })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedQuizzes.has(quiz.id) && (
              <CardContent className="space-y-4 pt-0">
                {/* Quiz Settings */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Passing Score (%)</Label>
                    <Input
                      type="number"
                      defaultValue={quiz.passingScore}
                      onChange={(e) => updateQuizMutation.mutate({ id: quiz.id, data: { passingScore: parseInt(e.target.value) } })}
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Limit (minutes)</Label>
                    <Input
                      type="number"
                      defaultValue={quiz.timeLimit || ''}
                      onChange={(e) => updateQuizMutation.mutate({ id: quiz.id, data: { timeLimit: parseInt(e.target.value) || undefined } })}
                      placeholder="No limit"
                    />
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Questions</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingQuestion({ quizId: quiz.id, question: { text: '', type: 'SINGLE_CHOICE', correctAnswer: '0', points: 1, sortOrder: quiz.questions.length } as Question })}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add Question
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {quiz.questions.map((question) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        onEdit={() => setEditingQuestion({ quizId: quiz.id, question })}
                        onDelete={() => setDeleteQuestion({ id: question.id, quizId: quiz.id, text: question.text })}
                      />
                    ))}
                  </div>

                  {quiz.questions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                      <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No questions yet. Add your first question.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {(!quizzes || quizzes.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No quizzes yet for this lesson</p>
              <Button onClick={() => createQuizMutation.mutate({ title: 'New Quiz', passingScore: 70 })}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create First Quiz
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quiz Editor Dialog */}
      <Dialog open={!!editingQuiz} onOpenChange={() => setEditingQuiz(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
            <DialogDescription>
              Edit the quiz details, questions, and settings below.
            </DialogDescription>
          </DialogHeader>
          {editingQuiz && (
            <QuizEditor
              quiz={editingQuiz}
              onSave={(data) => {
                updateQuizMutation.mutate({ id: editingQuiz.id, data });
                setEditingQuiz(null);
              }}
              onCancel={() => setEditingQuiz(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Question Editor Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Edit the question text, options, and correct answer below.
            </DialogDescription>
          </DialogHeader>
          {editingQuestion && (
            <QuestionEditor
              question={editingQuestion.question}
              onSave={(data) => {
                if (editingQuestion.question.id) {
                  updateQuestionMutation.mutate({ id: editingQuestion.question.id, data });
                } else {
                  createQuestionMutation.mutate({ quizId: editingQuestion.quizId, data });
                }
                setEditingQuestion(null);
              }}
              onCancel={() => setEditingQuestion(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Quiz Confirmation Dialog */}
      <Dialog open={!!deleteQuiz} onOpenChange={() => setDeleteQuiz(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteQuiz?.title}"? This action cannot be undone and will also delete all questions in this quiz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteQuiz(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteQuiz) {
                  deleteQuizMutation.mutate(deleteQuiz.id);
                  setDeleteQuiz(null);
                }
              }}
            >
              Delete Quiz
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Question Confirmation Dialog */}
      <Dialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question: "{deleteQuestion?.text}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteQuestion(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteQuestion) {
                  deleteQuestionMutation.mutate(deleteQuestion.id);
                  setDeleteQuestion(null);
                }
              }}
            >
              Delete Question
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  onEdit: () => void;
  onDelete: () => void;
}

function QuestionCard({ question, onEdit, onDelete }: QuestionCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          <Badge variant="outline">{question.type}</Badge>
          <span className="font-medium text-sm">{question.text}</span>
          <Badge variant="secondary">{question.points} pts</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>
      {question.explanation && (
        <p className="text-xs text-muted-foreground">{question.explanation}</p>
      )}
    </div>
  );
}

interface QuizEditorProps {
  quiz: Quiz;
  onSave: (data: Partial<Quiz>) => void;
  onCancel: () => void;
}

function QuizEditor({ quiz, onSave, onCancel }: QuizEditorProps) {
  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description || '');
  const [passingScore, setPassingScore] = useState(quiz.passingScore);
  const [timeLimit, setTimeLimit] = useState(quiz.timeLimit?.toString() || '');

  const handleSave = () => {
    onSave({
      title,
      description,
      passingScore,
      timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quizTitle">Title</Label>
        <Input
          id="quizTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quizDescription">Description</Label>
        <Textarea
          id="quizDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="passingScore">Passing Score (%)</Label>
          <Input
            id="passingScore"
            type="number"
            value={passingScore}
            onChange={(e) => setPassingScore(parseInt(e.target.value))}
            min={0}
            max={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
          <Input
            id="timeLimit"
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            placeholder="No limit"
          />
        </div>
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

interface QuestionEditorProps {
  question: Question;
  onSave: (data: Partial<Question>) => void;
  onCancel: () => void;
}

function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [text, setText] = useState(question.text);
  const [type, setType] = useState(question.type);
  const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer);
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [points, setPoints] = useState(question.points);
  const [options, setOptions] = useState<string[]>(() => {
    if (question.options && typeof question.options === 'object') {
      return Object.values(question.options) as string[];
    }
    return [];
  });
  const [newOption, setNewOption] = useState('');

  const addOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const optionsObj: Record<string, unknown> = {};
    options.forEach((opt, i) => {
      optionsObj[i.toString()] = opt;
    });

    onSave({
      text,
      type,
      correctAnswer,
      explanation,
      points,
      options: optionsObj,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="questionText">Question</Label>
        <Textarea
          id="questionText"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="questionType">Question Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(type === 'MULTIPLE_CHOICE' || type === 'SINGLE_CHOICE') && (
        <div className="space-y-2">
          <Label>Options</Label>
          <div className="flex gap-2">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addOption()}
              placeholder="Option text"
            />
            <Button type="button" onClick={addOption}>
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {options.map((opt, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm">{index + 1}.</span>
                <span className="flex-1 text-sm">{opt}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="correctAnswer">Correct Answer</Label>
        <Input
          id="correctAnswer"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          placeholder={type === 'SINGLE_CHOICE' ? 'Option index (0, 1, 2...)' : 'Answer text'}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">Explanation</Label>
        <Textarea
          id="explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          placeholder="Explain why this is the correct answer..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="points">Points</Label>
        <Input
          id="points"
          type="number"
          value={points}
          onChange={(e) => setPoints(parseInt(e.target.value))}
          min={1}
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
