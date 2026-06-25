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
  PlusCircle, Trash2, Edit2, Megaphone, Calendar, 
  Loader2, Clock
} from 'lucide-react';

interface AnnouncementManagerProps {
  courseId: string;
  accessToken?: string;
}

interface Announcement {
  id: string;
  courseId: string;
  title: string;
  content: string;
  createdAt: string;
}

export function AnnouncementManager({ courseId, accessToken }: AnnouncementManagerProps) {
  const queryClient = useQueryClient();
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements', courseId],
    queryFn: () => api.get(`/announcements/course/${courseId}`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['announcements', courseId] });
  };

  const createAnnouncementMutation = useMutation({
    mutationFn: (data: Partial<Announcement>) =>
      api.post('/announcements', { courseId, ...data }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Announcement> }) =>
      api.put(`/announcements/${id}`, data, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/announcements/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
          <h2 className="text-2xl font-bold">Announcements</h2>
          <p className="text-muted-foreground">Communicate with enrolled students</p>
        </div>
        <Button onClick={() => setEditingAnnouncement({ title: '', content: '' } as Announcement)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements?.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  <span className="font-medium">{announcement.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditingAnnouncement(announcement)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(announcement.createdAt)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
            </CardContent>
          </Card>
        ))}

        {(!announcements || announcements.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No announcements yet</p>
              <Button onClick={() => setEditingAnnouncement({ title: '', content: '' } as Announcement)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create First Announcement
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Announcement Editor Dialog */}
      <Dialog open={!!editingAnnouncement} onOpenChange={() => setEditingAnnouncement(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement?.id ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
            <DialogDescription>
              {editingAnnouncement?.id ? 'Update the announcement below.' : 'Create a new announcement for your students.'}
            </DialogDescription>
          </DialogHeader>
          {editingAnnouncement && (
            <AnnouncementEditor
              announcement={editingAnnouncement}
              onSave={(data) => {
                if (editingAnnouncement.id) {
                  updateAnnouncementMutation.mutate({ id: editingAnnouncement.id, data });
                } else {
                  createAnnouncementMutation.mutate(data);
                }
                setEditingAnnouncement(null);
              }}
              onCancel={() => setEditingAnnouncement(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AnnouncementEditorProps {
  announcement: Announcement;
  onSave: (data: Partial<Announcement>) => void;
  onCancel: () => void;
}

function AnnouncementEditor({ announcement, onSave, onCancel }: AnnouncementEditorProps) {
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);

  const handleSave = () => {
    onSave({ title, content });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="announcementTitle">Title</Label>
        <Input
          id="announcementTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="announcementContent">Content</Label>
        <Textarea
          id="announcementContent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Write your announcement message..."
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
