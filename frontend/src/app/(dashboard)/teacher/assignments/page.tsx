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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Search, Code } from 'lucide-react';

export default function TeacherAssignments() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    difficulty: 'BEGINNER',
    language: 'JAVASCRIPT',
    starterCode: '',
    maxScore: 100,
    dueDate: '',
    courseId: '',
  });

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['instructor-assignments'],
    queryFn: () => api.get('/assignments/instructor', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  const { data: courses } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => api.get('/courses/instructor/my-courses', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      api.post('/assignments', data, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-assignments'] });
      setCreateDialogOpen(false);
      setCreateForm({
        title: '',
        description: '',
        difficulty: 'BEGINNER',
        language: 'JAVASCRIPT',
        starterCode: '',
        maxScore: 100,
        dueDate: '',
        courseId: '',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/assignments/${id}`, data, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-assignments'] });
      setEditDialogOpen(false);
      setSelectedAssignment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/assignments/${id}`, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-assignments'] });
      setDeleteDialogOpen(false);
      setSelectedAssignment(null);
    },
  });

  const handleCreate = () => {
    createMutation.mutate(createForm);
  };

  const handleEdit = (assignment: any) => {
    setSelectedAssignment(assignment);
    setCreateForm({
      title: assignment.title,
      description: assignment.description,
      difficulty: assignment.difficulty,
      language: assignment.language,
      starterCode: assignment.starterCode,
      maxScore: assignment.maxScore,
      dueDate: assignment.dueDate,
      courseId: assignment.courseId,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (selectedAssignment) {
      updateMutation.mutate({ id: selectedAssignment.id, data: createForm });
    }
  };

  const handleDelete = (assignment: any) => {
    setSelectedAssignment(assignment);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedAssignment) {
      deleteMutation.mutate(selectedAssignment.id);
    }
  };

  const filteredAssignments = () => {
    let result = Array.isArray(assignments) ? [...assignments] : [];

    if (searchQuery) {
      result = result.filter((a: any) =>
        a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (courseFilter !== 'all') {
      result = result.filter((a: any) => a.courseId === courseFilter);
    }

    if (difficultyFilter !== 'all') {
      result = result.filter((a: any) => a.difficulty === difficultyFilter);
    }

    return result;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground mt-1">Manage coding challenges and assignments</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Assignment
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="search">Search:</Label>
          <Input
            id="search"
            placeholder="Search assignments..."
            className="max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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

        <div className="flex items-center gap-2">
          <Label htmlFor="difficulty-filter">Difficulty:</Label>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger id="difficulty-filter" className="w-[180px]">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="BEGINNER">Beginner</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
              <SelectItem value="ADVANCED">Advanced</SelectItem>
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
      ) : filteredAssignments().length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments().map((assignment: any) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{assignment.title}</CardTitle>
                  <Badge variant={new Date(assignment.dueDate) < new Date() ? 'destructive' : 'default'}>
                    {new Date(assignment.dueDate) < new Date() ? 'PAST DUE' : 'ACTIVE'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{assignment.description}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{assignment.difficulty}</Badge>
                    <Badge variant="outline">{assignment.language}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Max Score: {assignment.maxScore}</span>
                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleEdit(assignment)}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDelete(assignment)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Code className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No assignments yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first assignment to challenge your students
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Assignment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Assignment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={createForm.difficulty} onValueChange={(value) => setCreateForm({ ...createForm, difficulty: value })}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Select value={createForm.language} onValueChange={(value) => setCreateForm({ ...createForm, language: value })}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JAVASCRIPT">JavaScript</SelectItem>
                    <SelectItem value="PYTHON">Python</SelectItem>
                    <SelectItem value="TYPESCRIPT">TypeScript</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="course">Course</Label>
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
              <Label htmlFor="starterCode">Starter Code</Label>
              <textarea
                id="starterCode"
                className="w-full min-h-[150px] p-3 border rounded-md resize-none font-mono text-sm"
                placeholder="// Enter starter code here..."
                value={createForm.starterCode}
                onChange={(e) => setCreateForm({ ...createForm, starterCode: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxScore">Max Score</Label>
                <Input
                  id="maxScore"
                  type="number"
                  value={createForm.maxScore}
                  onChange={(e) => setCreateForm({ ...createForm, maxScore: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <textarea
                id="edit-description"
                className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-difficulty">Difficulty</Label>
                <Select value={createForm.difficulty} onValueChange={(value) => setCreateForm({ ...createForm, difficulty: value })}>
                  <SelectTrigger id="edit-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-language">Language</Label>
                <Select value={createForm.language} onValueChange={(value) => setCreateForm({ ...createForm, language: value })}>
                  <SelectTrigger id="edit-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JAVASCRIPT">JavaScript</SelectItem>
                    <SelectItem value="PYTHON">Python</SelectItem>
                    <SelectItem value="TYPESCRIPT">TypeScript</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-starterCode">Starter Code</Label>
              <textarea
                id="edit-starterCode"
                className="w-full min-h-[150px] p-3 border rounded-md resize-none font-mono text-sm"
                value={createForm.starterCode}
                onChange={(e) => setCreateForm({ ...createForm, starterCode: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-maxScore">Max Score</Label>
                <Input
                  id="edit-maxScore"
                  type="number"
                  value={createForm.maxScore}
                  onChange={(e) => setCreateForm({ ...createForm, maxScore: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                />
              </div>
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
            <AlertDialogTitle>Are you sure you want to delete this assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the assignment
              and all associated student submissions.
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
