'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, PlusCircle, Edit, Trash2, Search } from 'lucide-react';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AdminChallenges() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [editingChallenge, setEditingChallenge] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<any>(null);
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    difficulty: 'BEGINNER',
    language: 'JAVASCRIPT',
    starterCode: '',
    testCases: '',
  });

  const { data: challengesResponse, isLoading } = useQuery<PaginatedResponse<any>>({
    queryKey: ['admin-challenges', searchQuery, difficultyFilter, languageFilter],
    queryFn: () => {
      let url = '/admin/challenges';
      if (searchQuery) url += `?search=${searchQuery}`;
      if (difficultyFilter !== 'all') url += `${searchQuery ? '&' : '?'}difficulty=${difficultyFilter}`;
      if (languageFilter !== 'all') url += `${searchQuery || difficultyFilter !== 'all' ? '&' : '?'}language=${languageFilter}`;
      return api.get(url, { token: accessToken || undefined });
    },
    enabled: !!accessToken,
  });

  const challenges = challengesResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      api.post('/admin/challenges', data, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      setIsCreating(false);
      setChallengeForm({
        title: '',
        description: '',
        difficulty: 'BEGINNER',
        language: 'JAVASCRIPT',
        starterCode: '',
        testCases: '',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/admin/challenges/${id}`, data, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      setEditDialogOpen(false);
      setEditingChallenge(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/admin/challenges/${id}`, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      setDeleteDialogOpen(false);
      setChallengeToDelete(null);
    },
  });

  const handleCreateChallenge = () => {
    createMutation.mutate(challengeForm);
  };

  const handleEditChallenge = (challenge: any) => {
    setEditingChallenge(challenge);
    setChallengeForm({
      title: challenge.title || '',
      description: challenge.description || '',
      difficulty: challenge.difficulty || 'BEGINNER',
      language: challenge.language || 'JAVASCRIPT',
      starterCode: challenge.starterCode || '',
      testCases: challenge.testCases || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingChallenge) {
      updateMutation.mutate({
        id: editingChallenge.id,
        data: challengeForm,
      });
    }
  };

  const handleDeleteChallenge = (challenge: any) => {
    setChallengeToDelete(challenge);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (challengeToDelete) {
      deleteMutation.mutate(challengeToDelete.id);
    }
  };

  const filteredChallenges = challenges.filter((challenge: any) => {
    if (difficultyFilter !== 'all' && challenge.difficulty !== difficultyFilter) return false;
    if (languageFilter !== 'all' && challenge.language !== languageFilter) return false;
    if (searchQuery && !challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !challenge.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coding Challenges</h1>
          <p className="text-muted-foreground mt-1">Manage coding challenges</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Challenge
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search challenges..." 
            className="w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="difficulty-filter">Difficulty:</Label>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger id="difficulty-filter" className="w-[180px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="BEGINNER">Beginner</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
              <SelectItem value="ADVANCED">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="language-filter">Language:</Label>
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger id="language-filter" className="w-[180px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="JAVASCRIPT">JavaScript</SelectItem>
              <SelectItem value="PYTHON">Python</SelectItem>
              <SelectItem value="TYPESCRIPT">TypeScript</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreateChallenge(); }}>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  placeholder="Challenge title" 
                  value={challengeForm.title}
                  onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Challenge description" 
                  rows={4}
                  value={challengeForm.description}
                  onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={challengeForm.difficulty} onValueChange={(value) => setChallengeForm({ ...challengeForm, difficulty: value })}>
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
                  <Select value={challengeForm.language} onValueChange={(value) => setChallengeForm({ ...challengeForm, language: value })}>
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
                <Label htmlFor="starterCode">Starter Code</Label>
                <Textarea 
                  id="starterCode" 
                  placeholder="Initial code for the challenge" 
                  rows={6}
                  value={challengeForm.starterCode}
                  onChange={(e) => setChallengeForm({ ...challengeForm, starterCode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="testCases">Test Cases</Label>
                <Textarea 
                  id="testCases" 
                  placeholder="Test cases for validation" 
                  rows={4}
                  value={challengeForm.testCases}
                  onChange={(e) => setChallengeForm({ ...challengeForm, testCases: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : Array.isArray(filteredChallenges) && filteredChallenges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-full mb-2 text-sm text-muted-foreground">
            Showing {filteredChallenges.length} of {challengesResponse?.meta?.total || filteredChallenges.length} challenges
          </div>
          {filteredChallenges.map((challenge: any) => (
            <Card key={challenge.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  <Badge variant="secondary">{challenge.difficulty}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {challenge.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{challenge.language}</Badge>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditChallenge(challenge)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteChallenge(challenge)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
            <h3 className="text-xl font-semibold mb-2">No challenges yet</h3>
            <p className="text-muted-foreground">
              Create coding challenges to test students' skills
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Challenge Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={challengeForm.title}
                onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={4}
                value={challengeForm.description}
                onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-difficulty">Difficulty</Label>
                <Select value={challengeForm.difficulty} onValueChange={(value) => setChallengeForm({ ...challengeForm, difficulty: value })}>
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
                <Select value={challengeForm.language} onValueChange={(value) => setChallengeForm({ ...challengeForm, language: value })}>
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
              <Textarea
                id="edit-starterCode"
                rows={6}
                value={challengeForm.starterCode}
                onChange={(e) => setChallengeForm({ ...challengeForm, starterCode: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-testCases">Test Cases</Label>
              <Textarea
                id="edit-testCases"
                rows={4}
                value={challengeForm.testCases}
                onChange={(e) => setChallengeForm({ ...challengeForm, testCases: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Challenge Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this challenge?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the challenge
              and all associated data.
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
