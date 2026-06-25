'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  PlusCircle, Trash2, Edit2, GripVertical, Video, FileText, Code,
  Image, Link as LinkIcon, File, AlertCircle, Lightbulb, CheckCircle,
  Type, Save, Loader2
} from 'lucide-react';

const CONTENT_BLOCK_TYPES = [
  'RICH_TEXT', 'MARKDOWN', 'CODE', 'IMAGE', 'VIDEO', 'FILE',
  'EXTERNAL_LINK', 'CALLOUT', 'NOTE', 'SUMMARY', 'EXAMPLE',
  'ASSIGNMENT', 'EXERCISE', 'QUIZ', 'CODING_CHALLENGE',
] as const;

const LESSON_TYPES = ['VIDEO', 'MARKDOWN', 'CODING'] as const;

interface LessonBuilderProps {
  lessonId: string;
  courseId: string;
  accessToken?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface ContentBlock {
  id: string;
  type: string;
  title?: string;
  content: Record<string, unknown>;
  sortOrder: number;
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  type: string;
  content?: string;
  videoUrl?: string;
  videoDuration?: number;
  isFree: boolean;
  summary?: string;
  keyTakeaways?: string[];
  nextLessonId?: string;
  contentBlocks?: ContentBlock[];
}

export function LessonBuilder({ lessonId, courseId, accessToken, onSave, onCancel }: LessonBuilderProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('content');
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localLesson, setLocalLesson] = useState<Partial<Lesson>>({});

  const { data: lesson, isLoading } = useQuery<Lesson>({
    queryKey: ['lesson', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}`, { token: accessToken }),
    enabled: !!lessonId && !!accessToken,
  });

  // Initialize local state when lesson data is loaded
  useEffect(() => {
    if (lesson) {
      setLocalLesson(lesson);
    }
  }, [lesson]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
    queryClient.invalidateQueries({ queryKey: ['course-structure', courseId] });
  };

  const updateLessonMutation = useMutation({
    mutationFn: (data: Partial<Lesson>) =>
      api.patch(`/lessons/${lessonId}`, data, { token: accessToken }),
    onSuccess: () => {
      invalidate();
      setIsSaving(false);
      if (onSave) onSave();
    },
    onError: () => {
      setIsSaving(false);
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: (data: { type: string; title?: string; content: Record<string, unknown> }) =>
      api.post('/course-structure/content-blocks', { lessonId, ...data }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const updateBlockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContentBlock> }) =>
      api.patch(`/course-structure/content-blocks/${id}`, data, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/course-structure/content-blocks/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const reorderBlocksMutation = useMutation({
    mutationFn: (ids: string[]) =>
      api.post('/course-structure/content-blocks/reorder', { lessonId, ids }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const handleSave = () => {
    setIsSaving(true);
    if (localLesson) {
      updateLessonMutation.mutate(localLesson);
    }
  };

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'RICH_TEXT':
      case 'MARKDOWN':
        return <Type className="h-4 w-4" />;
      case 'CODE':
      case 'CODING_CHALLENGE':
        return <Code className="h-4 w-4" />;
      case 'IMAGE':
        return <Image className="h-4 w-4" />;
      case 'VIDEO':
        return <Video className="h-4 w-4" />;
      case 'FILE':
        return <File className="h-4 w-4" />;
      case 'EXTERNAL_LINK':
        return <LinkIcon className="h-4 w-4" />;
      case 'CALLOUT':
        return <AlertCircle className="h-4 w-4" />;
      case 'NOTE':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lesson) {
    return <div className="text-muted-foreground">Lesson not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{localLesson.title || lesson?.title}</h2>
          <p className="text-muted-foreground">{localLesson.type || lesson?.type} Lesson</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Lesson
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="blocks">Content Blocks</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={localLesson.title || ''}
                  onChange={(e) => setLocalLesson({ ...localLesson, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={localLesson.slug || ''}
                  onChange={(e) => setLocalLesson({ ...localLesson, slug: e.target.value })}
                />
              </div>

              {(localLesson.type === 'VIDEO' || lesson?.type === 'VIDEO') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">Video URL</Label>
                    <Input
                      id="videoUrl"
                      value={localLesson.videoUrl || ''}
                      onChange={(e) => setLocalLesson({ ...localLesson, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoDuration">Video Duration (seconds)</Label>
                    <Input
                      id="videoDuration"
                      type="number"
                      value={localLesson.videoDuration || ''}
                      onChange={(e) => setLocalLesson({ ...localLesson, videoDuration: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                </>
              )}

              {(localLesson.type === 'MARKDOWN' || localLesson.type === 'CODING' || lesson?.type === 'MARKDOWN' || lesson?.type === 'CODING') && (
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={localLesson.content || ''}
                    onChange={(e) => setLocalLesson({ ...localLesson, content: e.target.value })}
                    rows={15}
                    placeholder="Write your lesson content here..."
                    className="font-mono"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="isFree"
                  checked={localLesson.isFree || false}
                  onCheckedChange={(checked) => setLocalLesson({ ...localLesson, isFree: checked })}
                />
                <Label htmlFor="isFree">Free Preview</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Lesson Type</Label>
                <Select value={localLesson.type || lesson?.type} onValueChange={(value) => setLocalLesson({ ...localLesson, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LESSON_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {type === 'VIDEO' && <Video className="h-4 w-4" />}
                          {type === 'MARKDOWN' && <FileText className="h-4 w-4" />}
                          {type === 'CODING' && <Code className="h-4 w-4" />}
                          {type}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isFreeSettings"
                  checked={localLesson.isFree || false}
                  onCheckedChange={(checked) => setLocalLesson({ ...localLesson, isFree: checked })}
                />
                <Label htmlFor="isFreeSettings">Free Preview</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Blocks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select onValueChange={(type) => createBlockMutation.mutate({ type, content: {} })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add content block" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_BLOCK_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {getBlockIcon(type)}
                          {type.replace(/_/g, ' ')}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {(localLesson.contentBlocks || lesson?.contentBlocks)?.map((block: ContentBlock) => (
                  <div key={block.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        {getBlockIcon(block.type)}
                        <span className="font-medium">{block.type.replace(/_/g, ' ')}</span>
                        {block.title && <Badge variant="outline">{block.title}</Badge>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingBlock(block)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteBlockMutation.mutate(block.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {block.type === 'RICH_TEXT' || block.type === 'MARKDOWN' ? (
                      <Textarea
                        defaultValue={(block.content as any)?.body || ''}
                        onChange={(e) => updateBlockMutation.mutate({ id: block.id, data: { content: { body: e.target.value } } })}
                        rows={4}
                        className="text-sm"
                      />
                    ) : block.type === 'CODE' || block.type === 'CODING_CHALLENGE' ? (
                      <Textarea
                        defaultValue={(block.content as any)?.code || ''}
                        onChange={(e) => updateBlockMutation.mutate({ id: block.id, data: { content: { code: e.target.value } } })}
                        rows={6}
                        className="font-mono text-sm"
                      />
                    ) : block.type === 'IMAGE' ? (
                      <Input
                        defaultValue={(block.content as any)?.url || ''}
                        onChange={(e) => updateBlockMutation.mutate({ id: block.id, data: { content: { url: e.target.value } } })}
                        placeholder="Image URL"
                      />
                    ) : block.type === 'VIDEO' ? (
                      <Input
                        defaultValue={(block.content as any)?.url || ''}
                        onChange={(e) => updateBlockMutation.mutate({ id: block.id, data: { content: { url: e.target.value } } })}
                        placeholder="Video URL"
                      />
                    ) : block.type === 'EXTERNAL_LINK' ? (
                      <div className="space-y-2">
                        <Input
                          defaultValue={(block.content as any)?.url || ''}
                          onChange={(e) => updateBlockMutation.mutate({ id: block.id, data: { content: { url: e.target.value } } })}
                          placeholder="Link URL"
                        />
                        <Input
                          defaultValue={(block.content as any)?.title || ''}
                          onChange={(e) => updateBlockMutation.mutate({ id: block.id, data: { content: { title: e.target.value } } })}
                          placeholder="Link Title"
                        />
                      </div>
                    ) : (
                      <Textarea
                        defaultValue={JSON.stringify(block.content, null, 2)}
                        onChange={(e) => {
                          try {
                            const content = JSON.parse(e.target.value);
                            updateBlockMutation.mutate({ id: block.id, data: { content } });
                          } catch (err) {
                            // Invalid JSON, ignore
                          }
                        }}
                        rows={4}
                        className="font-mono text-sm"
                      />
                    )}
                  </div>
                ))}

                {(!localLesson.contentBlocks && !lesson?.contentBlocks) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No content blocks yet. Add your first block above.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={localLesson.summary || ''}
                  onChange={(e) => setLocalLesson({ ...localLesson, summary: e.target.value })}
                  rows={3}
                  placeholder="Brief summary of this lesson..."
                />
              </div>

              <div className="space-y-2">
                <Label>Key Takeaways</Label>
                <KeyTakeawaysEditor
                  takeaways={localLesson.keyTakeaways || []}
                  onChange={(takeaways) => setLocalLesson({ ...localLesson, keyTakeaways: takeaways })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Content Block Editor Dialog */}
      <Dialog open={!!editingBlock} onOpenChange={() => setEditingBlock(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Content Block</DialogTitle>
            <DialogDescription>
              Edit the content block details and configuration below.
            </DialogDescription>
          </DialogHeader>
          {editingBlock && (
            <ContentBlockEditor
              block={editingBlock}
              onSave={(data) => {
                updateBlockMutation.mutate({ id: editingBlock.id, data });
                setEditingBlock(null);
              }}
              onCancel={() => setEditingBlock(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface KeyTakeawaysEditorProps {
  takeaways: string[];
  onChange: (takeaways: string[]) => void;
}

function KeyTakeawaysEditor({ takeaways, onChange }: KeyTakeawaysEditorProps) {
  const [input, setInput] = useState('');

  const addTakeaway = () => {
    if (input.trim()) {
      onChange([...takeaways, input.trim()]);
      setInput('');
    }
  };

  const removeTakeaway = (index: number) => {
    onChange(takeaways.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTakeaway()}
          placeholder="Students will learn..."
        />
        <Button type="button" onClick={addTakeaway}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {takeaways.map((takeaway, index) => (
          <Badge key={index} variant="secondary" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            {takeaway}
            <button
              type="button"
              onClick={() => removeTakeaway(index)}
              className="ml-1 hover:text-destructive"
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

interface ContentBlockEditorProps {
  block: ContentBlock;
  onSave: (data: Partial<ContentBlock>) => void;
  onCancel: () => void;
}

function ContentBlockEditor({ block, onSave, onCancel }: ContentBlockEditorProps) {
  const [title, setTitle] = useState(block.title || '');
  const [content, setContent] = useState(JSON.stringify(block.content, null, 2));

  const handleSave = () => {
    try {
      const parsedContent = JSON.parse(content);
      onSave({ title, content: parsedContent });
    } catch (err) {
      // Invalid JSON, show error
      alert('Invalid JSON format');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="blockTitle">Title (Optional)</Label>
        <Input
          id="blockTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Block title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="blockContent">Content (JSON)</Label>
        <Textarea
          id="blockContent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="font-mono text-sm"
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
