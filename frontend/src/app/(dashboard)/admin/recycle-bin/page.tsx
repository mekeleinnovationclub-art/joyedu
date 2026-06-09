'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, RefreshCw, Users, BookOpen, Code } from 'lucide-react';

interface DeletedItem {
  id: string;
  username?: string;
  email?: string;
  title?: string;
  slug?: string;
  difficulty?: string;
  roles?: string[];
  deletedAt: string;
}

interface RecycleBinResponse {
  users: DeletedItem[];
  courses: DeletedItem[];
  challenges: DeletedItem[];
}

export default function RecycleBin() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users');

  const { data: deletedItems, isLoading } = useQuery({
    queryKey: ['recycle-bin'],
    queryFn: () => api.get<RecycleBinResponse>('/admin/recycle-bin?page=1&limit=20', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  const restoreUserMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/admin/recycle-bin/users/${id}/restore`, {}, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] });
    },
  });

  const restoreCourseMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/admin/recycle-bin/courses/${id}/restore`, {}, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] });
    },
  });

  const restoreChallengeMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/admin/recycle-bin/challenges/${id}/restore`, {}, { token: accessToken || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] });
    },
  });

  const handleRestoreUser = (id: string) => {
    restoreUserMutation.mutate(id);
  };

  const handleRestoreCourse = (id: string) => {
    restoreCourseMutation.mutate(id);
  };

  const handleRestoreChallenge = (id: string) => {
    restoreChallengeMutation.mutate(id);
  };

  const users = deletedItems?.users || [];
  const courses = deletedItems?.courses || [];
  const challenges = deletedItems?.challenges || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recycle Bin</h1>
        <p className="text-muted-foreground mt-1">View and restore deleted items</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="mr-2 h-4 w-4" />
            Courses ({courses.length})
          </TabsTrigger>
          <TabsTrigger value="challenges">
            <Code className="mr-2 h-4 w-4" />
            Challenges ({challenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trash2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No deleted users</h3>
                <p className="text-muted-foreground">
                  Deleted users will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Deleted Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium">{user.username}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex gap-2 mt-1">
                            {user.roles?.map((role: string) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Deleted: {new Date(user.deletedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRestoreUser(user.id)}
                        disabled={restoreUserMutation.isPending}
                        size="sm"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trash2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No deleted courses</h3>
                <p className="text-muted-foreground">
                  Deleted courses will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Deleted Courses ({courses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.map((course: any) => (
                    <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">{course.slug}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Deleted: {new Date(course.deletedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRestoreCourse(course.id)}
                        disabled={restoreCourseMutation.isPending}
                        size="sm"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trash2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No deleted challenges</h3>
                <p className="text-muted-foreground">
                  Deleted challenges will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Deleted Challenges ({challenges.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {challenges.map((challenge: any) => (
                    <div key={challenge.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Code className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium">{challenge.title}</h3>
                          <p className="text-sm text-muted-foreground">{challenge.slug}</p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {challenge.difficulty}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Deleted: {new Date(challenge.deletedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRestoreChallenge(challenge.id)}
                        disabled={restoreChallengeMutation.isPending}
                        size="sm"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
