'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, Trash2, Edit2, FolderOpen, File, Upload, 
  Loader2, Download, ExternalLink
} from 'lucide-react';

interface ResourceManagerProps {
  courseId: string;
  lessonId?: string;
  accessToken?: string;
}

interface Resource {
  id: string;
  title: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  lessonId?: string;
  courseId?: string;
  createdAt: string;
}

export function ResourceManager({ courseId, lessonId, accessToken }: ResourceManagerProps) {
  const queryClient = useQueryClient();
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [activeTab, setActiveTab] = useState(lessonId ? 'lesson' : 'course');

  const { data: lessonResources, isLoading: loadingLesson } = useQuery<Resource[]>({
    queryKey: ['resources', 'lesson', lessonId],
    queryFn: () => api.get(`/resources/lesson/${lessonId}`, { token: accessToken }),
    enabled: !!lessonId && !!accessToken && activeTab === 'lesson',
  });

  const { data: courseResources, isLoading: loadingCourse } = useQuery<Resource[]>({
    queryKey: ['resources', 'course', courseId],
    queryFn: () => api.get(`/resources/course/${courseId}`, { token: accessToken }),
    enabled: !!courseId && !!accessToken && activeTab === 'course',
  });

  const invalidate = () => {
    if (lessonId) queryClient.invalidateQueries({ queryKey: ['resources', 'lesson', lessonId] });
    queryClient.invalidateQueries({ queryKey: ['resources', 'course', courseId] });
  };

  const createResourceMutation = useMutation({
    mutationFn: (data: Partial<Resource>) =>
      api.post('/resources', { courseId, lessonId, ...data }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Resource> }) =>
      api.put(`/resources/${id}`, data, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/resources/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const isLoading = activeTab === 'lesson' ? loadingLesson : loadingCourse;
  const resources = activeTab === 'lesson' ? lessonResources : courseResources;

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
          <h2 className="text-2xl font-bold">Resources</h2>
          <p className="text-muted-foreground">Manage course materials and downloads</p>
        </div>
        <Button onClick={() => setEditingResource({ title: '', fileUrl: '' } as Resource)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Tabs */}
      {lessonId && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="lesson">Lesson Resources</TabsTrigger>
            <TabsTrigger value="course">Course Resources</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Resources List */}
      <div className="space-y-4">
        {resources?.map((resource) => (
          <Card key={resource.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <File className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{resource.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {resource.fileType && <Badge variant="outline">{resource.fileType}</Badge>}
                    {resource.fileSize && <span>{(resource.fileSize / 1024).toFixed(1)} KB</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </a>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditingResource(resource)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteResourceMutation.mutate(resource.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!resources || resources.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No resources yet</p>
              <Button onClick={() => setEditingResource({ title: '', fileUrl: '' } as Resource)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add First Resource
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Resource Editor Dialog */}
      <Dialog open={!!editingResource} onOpenChange={() => setEditingResource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingResource?.id ? 'Edit Resource' : 'Create Resource'}</DialogTitle>
            <DialogDescription>
              {editingResource?.id ? 'Update the resource details below.' : 'Add a new resource to your course.'}
            </DialogDescription>
          </DialogHeader>
          {editingResource && (
            <ResourceEditor
              resource={editingResource}
              onSave={(data) => {
                if (editingResource.id) {
                  updateResourceMutation.mutate({ id: editingResource.id, data });
                } else {
                  createResourceMutation.mutate(data);
                }
                setEditingResource(null);
              }}
              onCancel={() => setEditingResource(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ResourceEditorProps {
  resource: Resource;
  onSave: (data: Partial<Resource>) => void;
  onCancel: () => void;
}

function ResourceEditor({ resource, onSave, onCancel }: ResourceEditorProps) {
  const [title, setTitle] = useState(resource.title);
  const [fileUrl, setFileUrl] = useState(resource.fileUrl);
  const [fileType, setFileType] = useState(resource.fileType || '');

  const handleSave = () => {
    onSave({ title, fileUrl, fileType });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resourceTitle">Title</Label>
        <Input
          id="resourceTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resource title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fileUrl">File URL</Label>
        <Input
          id="fileUrl"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="https://example.com/resource.pdf"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fileType">File Type (Optional)</Label>
        <Input
          id="fileType"
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          placeholder="PDF, ZIP, DOCX, etc."
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
