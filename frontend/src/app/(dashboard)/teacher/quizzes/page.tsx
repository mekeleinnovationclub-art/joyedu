'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Search, FileText, MoreHorizontal, Clock } from 'lucide-react';

export default function TeacherQuizzes() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    courseId: '',
    timeLimit: 30,
    isActive: true,
  });

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['instructor-quizzes'],
    queryFn: () => api.get('/quizzes/instructor', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  const { data: courses } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => api.get('/courses/instructor/my-courses', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      api.post('/quizzes', data, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-quizzes'] });
      setCreateDialogOpen(false);
      setCreateForm({
        title: '',
        courseId: '',
        timeLimit: 30,
        isActive: true,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/quizzes/${id}`, data, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-quizzes'] });
      setEditDialogOpen(false);
      setSelectedQuiz(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/quizzes/${id}`, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-quizzes'] });
      setDeleteDialogOpen(false);
      setSelectedQuiz(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/quizzes/${id}`, { isActive }, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-quizzes'] });
    },
  });

  const handleCreate = () => {
    createMutation.mutate(createForm);
  };

  const handleEdit = (quiz: any) => {
    setSelectedQuiz(quiz);
    setCreateForm({
      title: quiz.title,
      courseId: quiz.courseId,
      timeLimit: quiz.timeLimit,
      isActive: quiz.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (selectedQuiz) {
      updateMutation.mutate({ id: selectedQuiz.id, data: createForm });
    }
  };

  const handleDelete = (quiz: any) => {
    setSelectedQuiz(quiz);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedQuiz) {
      deleteMutation.mutate(selectedQuiz.id);
    }
  };

  const handleToggleActive = (quiz: any) => {
    toggleActiveMutation.mutate({ id: quiz.id, isActive: !quiz.isActive });
  };

  const filteredQuizzes = () => {
    let result = Array.isArray(quizzes) ? [...quizzes] : [];

    if (searchQuery) {
      result = result.filter((q: any) =>
        q.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((q: any) => q.isActive === (statusFilter === 'active'));
    }

    if (courseFilter !== 'all') {
      result = result.filter((q: any) => q.courseId === courseFilter);
    }

    return result;
  };

  const hasQuizzes = Array.isArray(quizzes) && quizzes.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quiz Bank</h1>
          <p className="text-muted-foreground mt-1">Manage quizzes and assessments</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Quiz
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="search">Search:</Label>
          <Input
            id="search"
            placeholder="Search quizzes..."
            className="max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter">Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="course-filter">Course:</Label>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger id="course-filter" className="w-[180px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {Array.isArray(courses) && courses.map((course: any) => (
                <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-6 w-1/3 bg-muted rounded mb-2" />
                <div className="h-4 w-2/3 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasQuizzes ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes().map((quiz: any) => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                  <Badge variant={quiz.isActive ? 'default' : 'secondary'}>
                    {quiz.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{quiz.questionCount || 0} questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{quiz.timeLimit} minutes</span>
                  </div>
                  {quiz.courseTitle && (
                    <Badge variant="outline" className="w-fit">
                      {quiz.courseTitle}
                    </Badge>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={quiz.isActive}
                        onCheckedChange={() => handleToggleActive(quiz)}
                        disabled={toggleActiveMutation.isPending}
                      />
                      <span className="text-sm text-muted-foreground">
                        {quiz.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(quiz)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Quiz
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(quiz)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Quiz
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent 
            className="p-12 text-center cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setCreateDialogOpen(true)}
          >
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No quizzes yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first quiz to assess your students
            </p>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Quiz
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Quiz Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="course">Target Course</Label>
              <Select value={createForm.courseId} onValueChange={(value) => setCreateForm({ ...createForm, courseId: value })}>
                <SelectTrigger id="course">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(courses) && courses.map((course: any) => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                value={createForm.timeLimit}
                onChange={(e) => setCreateForm({ ...createForm, timeLimit: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={createForm.isActive}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, isActive: checked })}
              />
              <Label htmlFor="isActive">Active (visible to students)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quiz Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">Quiz Title</Label>
              <Input
                id="edit-title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-timeLimit">Time Limit (minutes)</Label>
              <Input
                id="edit-timeLimit"
                type="number"
                value={createForm.timeLimit}
                onChange={(e) => setCreateForm({ ...createForm, timeLimit: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-isActive"
                checked={createForm.isActive}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Active (visible to students)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quiz
              and all associated student responses.
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
