'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { 
  PlusCircle, Trash2, Edit2, Image, Video, File as FileIcon, 
  Loader2, GripVertical, ChevronDown, ChevronRight
} from 'lucide-react';

const MEDIA_TYPES = ['IMAGE', 'VIDEO', 'DOCUMENT'] as const;

interface MediaGalleryProps {
  courseId: string;
  accessToken?: string;
}

interface CourseMedia {
  id: string;
  courseId: string;
  type: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export function MediaGallery({ courseId, accessToken }: MediaGalleryProps) {
  const queryClient = useQueryClient();
  const [editingMedia, setEditingMedia] = useState<CourseMedia | null>(null);

  const { data: media, isLoading } = useQuery<CourseMedia[]>({
    queryKey: ['course-media', courseId],
    queryFn: () => api.get(`/course-media/course/${courseId}`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['course-media', courseId] });
  };

  const createMediaMutation = useMutation({
    mutationFn: (data: Partial<CourseMedia>) =>
      api.post('/course-media', { courseId, ...data }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const updateMediaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CourseMedia> }) =>
      api.put(`/course-media/${id}`, data, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/course-media/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const reorderMediaMutation = useMutation({
    mutationFn: (mediaIds: string[]) =>
      api.post('/course-media/reorder', { courseId, mediaIds }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <Image className="h-4 w-4" />;
      case 'VIDEO':
        return <Video className="h-4 w-4" />;
      case 'DOCUMENT':
        return <FileIcon className="h-4 w-4" />;
      default:
        return <FileIcon className="h-4 w-4" />;
    }
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
          <h2 className="text-2xl font-bold">Media Gallery</h2>
          <p className="text-muted-foreground">Manage images, videos, and documents for your course</p>
        </div>
        <Button onClick={() => setEditingMedia({ type: 'IMAGE', url: '', sortOrder: 0 } as CourseMedia)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Media
        </Button>
      </div>

      {/* Media Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {media?.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                {item.type === 'IMAGE' ? (
                  <img
                    src={item.url}
                    alt={item.altText || item.type}
                    className="w-full h-full object-cover"
                  />
                ) : item.type === 'VIDEO' ? (
                  <video src={item.url} className="w-full h-full object-cover" controls />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getMediaIcon(item.type)}
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingMedia(item)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMediaMutation.mutate(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {item.altText && (
                  <p className="text-sm text-muted-foreground">{item.altText}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {(!media || media.length === 0) && (
          <Card className="border-dashed col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Image className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No media yet for this course</p>
              <Button onClick={() => setEditingMedia({ type: 'IMAGE', url: '', sortOrder: 0 } as CourseMedia)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add First Media
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Media Editor Dialog */}
      <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMedia?.id ? 'Edit Media' : 'Add Media'}</DialogTitle>
            <DialogDescription>
              {editingMedia?.id ? 'Update the media details below.' : 'Add new media to your course gallery.'}
            </DialogDescription>
          </DialogHeader>
          {editingMedia && (
            <MediaEditor
              media={editingMedia}
              onSave={(data) => {
                if (editingMedia.id) {
                  updateMediaMutation.mutate({ id: editingMedia.id, data });
                } else {
                  createMediaMutation.mutate(data);
                }
                setEditingMedia(null);
              }}
              onCancel={() => setEditingMedia(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MediaEditorProps {
  media: CourseMedia;
  onSave: (data: Partial<CourseMedia>) => void;
  onCancel: () => void;
}

function MediaEditor({ media, onSave, onCancel }: MediaEditorProps) {
  const [type, setType] = useState(media.type);
  const [url, setUrl] = useState(media.url);
  const [altText, setAltText] = useState(media.altText || '');

  const handleSave = () => {
    onSave({ type, url, altText });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mediaType">Media Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEDIA_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                <div className="flex items-center gap-2">
                  {t === 'IMAGE' && <Image className="h-4 w-4" />}
                  {t === 'VIDEO' && <Video className="h-4 w-4" />}
                  {t === 'DOCUMENT' && <FileIcon className="h-4 w-4" />}
                  {t}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mediaUrl">URL</Label>
        <Input
          id="mediaUrl"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/media.jpg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="altText">Alt Text (Optional)</Label>
        <Input
          id="altText"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Description for accessibility"
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
