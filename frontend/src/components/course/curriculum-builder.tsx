'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  PlusCircle, Trash2, ChevronDown, ChevronRight, GripVertical, 
  Edit2, Video, FileText, Code, Layers 
} from 'lucide-react';

const LESSON_TYPES = ['VIDEO', 'MARKDOWN', 'CODING'] as const;

interface CurriculumBuilderProps {
  courseId: string;
  accessToken?: string;
}

interface Topic {
  id: string;
  title: string;
  description?: string;
  sortOrder: number;
  subtopics: Subtopic[];
}

interface Subtopic {
  id: string;
  title: string;
  description?: string;
  sortOrder: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  type: string;
  sortOrder: number;
  contentBlocks?: any[];
  quizzes?: any[];
  exercises?: any[];
}

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export function CurriculumBuilder({ courseId, accessToken }: CurriculumBuilderProps) {
  const queryClient = useQueryClient();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<{ type: 'topic' | 'subtopic' | 'lesson'; id: string; title: string; description?: string } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: 'topic' | 'subtopic' | 'lesson'; id: string; title: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: structure, isLoading, refetch } = useQuery<{ topics: Topic[] }>({
    queryKey: ['course-structure', courseId],
    queryFn: () => api.get(`/course-structure/courses/${courseId}/structure`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['course-structure', courseId] });
  };

  // Topic mutations
  const createTopic = useMutation({
    mutationFn: (title: string) =>
      api.post('/topics', { courseId, title }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const updateTopic = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/topics/${id}`, data, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteTopic = useMutation({
    mutationFn: (id: string) => api.delete(`/topics/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const reorderTopics = useMutation({
    mutationFn: (ids: string[]) =>
      api.post('/topics/reorder', { courseId, topicIds: ids }, { token: accessToken }),
    onSuccess: invalidate,
  });

  // Subtopic mutations
  const createSubtopic = useMutation({
    mutationFn: ({ topicId, title }: { topicId: string; title: string }) =>
      api.post('/subtopics', { topicId, title }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const updateSubtopic = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/subtopics/${id}`, data, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteSubtopic = useMutation({
    mutationFn: (id: string) => api.delete(`/subtopics/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const reorderSubtopics = useMutation({
    mutationFn: ({ topicId, ids }: { topicId: string; ids: string[] }) =>
      api.post('/subtopics/reorder', { topicId, subtopicIds: ids }, { token: accessToken }),
    onSuccess: invalidate,
  });

  // Lesson mutations
  const createLesson = useMutation({
    mutationFn: ({ subtopicId, title, type }: { subtopicId: string; title: string; type: string }) =>
      api.post('/lessons', { subtopicId, title, slug: title.toLowerCase().replace(/\s+/g, '-'), type }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const updateLesson = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/lessons/${id}`, data, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteLesson = useMutation({
    mutationFn: (id: string) => api.delete(`/lessons/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const reorderLessons = useMutation({
    mutationFn: ({ subtopicId, ids }: { subtopicId: string; ids: string[] }) =>
      api.post('/lessons/reorder', { subtopicId, lessonIds: ids }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Handle topic reordering
    const topics = structure?.topics || [];
    const activeTopic = topics.find((t) => t.id === active.id);
    const overTopic = topics.find((t) => t.id === over.id);

    if (activeTopic && overTopic && active.id !== over.id) {
      const newOrder = [...topics];
      const activeIndex = newOrder.findIndex((t) => t.id === active.id);
      const overIndex = newOrder.findIndex((t) => t.id === over.id);
      newOrder.splice(activeIndex, 1);
      newOrder.splice(overIndex, 0, activeTopic);
      reorderTopics.mutate(newOrder.map((t) => t.id));
    }
  };

  const toggleTopic = (id: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSubtopic = (id: string) => {
    setExpandedSubtopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading curriculum...</div>;
  }

  const topics = structure?.topics || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Curriculum</h3>
        <Button onClick={() => createTopic.mutate('New Topic')} disabled={createTopic.isPending}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Topic
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={topics.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {topics.map((topic) => (
            <SortableItem key={topic.id} id={topic.id}>
              <TopicCard
                topic={topic}
                isExpanded={expandedTopics.has(topic.id)}
                onToggle={() => toggleTopic(topic.id)}
                onEdit={() => setEditingItem({ type: 'topic', id: topic.id, title: topic.title, description: topic.description })}
                onDelete={() => setDeleteItem({ type: 'topic', id: topic.id, title: topic.title })}
                onCreateSubtopic={(title) => createSubtopic.mutate({ topicId: topic.id, title })}
                onEditSubtopic={(id, title) => setEditingItem({ type: 'subtopic', id, title })}
                onDeleteSubtopic={(id, title) => setDeleteItem({ type: 'subtopic', id, title })}
                onReorderSubtopics={(ids) => reorderSubtopics.mutate({ topicId: topic.id, ids })}
                expandedSubtopics={expandedSubtopics}
                onToggleSubtopic={toggleSubtopic}
                onCreateLesson={(subtopicId, title, type) => createLesson.mutate({ subtopicId, title, type })}
                onUpdateLesson={(id, data) => updateLesson.mutate({ id, data })}
                onDeleteLesson={(id, title) => setDeleteItem({ type: 'lesson', id, title })}
                onReorderLessons={(subtopicId, ids) => reorderLessons.mutate({ subtopicId, ids })}
                accessToken={accessToken}
              />
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>

      {topics.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No topics yet. Start building your curriculum!</p>
            <Button onClick={() => createTopic.mutate('New Topic')}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add First Topic
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {editingItem?.type === 'topic' ? 'Topic' : editingItem?.type === 'subtopic' ? 'Subtopic' : 'Lesson'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                defaultValue={editingItem?.title}
                onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
            </div>
            {editingItem?.type === 'topic' && (
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  defaultValue={editingItem?.description}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editingItem) {
                  if (editingItem.type === 'topic') {
                    updateTopic.mutate({ id: editingItem.id, data: { title: editingItem.title, description: editingItem.description } });
                  } else if (editingItem.type === 'subtopic') {
                    updateSubtopic.mutate({ id: editingItem.id, data: { title: editingItem.title } });
                  } else if (editingItem.type === 'lesson') {
                    updateLesson.mutate({ id: editingItem.id, data: { title: editingItem.title } });
                  }
                  setEditingItem(null);
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteItem?.type === 'topic' ? 'Topic' : deleteItem?.type === 'subtopic' ? 'Subtopic' : 'Lesson'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteItem?.title}"? This action cannot be undone.
              {deleteItem?.type === 'topic' && ' This will also delete all subtopics and lessons within this topic.'}
              {deleteItem?.type === 'subtopic' && ' This will also delete all lessons within this subtopic.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteItem) {
                  if (deleteItem.type === 'topic') {
                    deleteTopic.mutate(deleteItem.id);
                  } else if (deleteItem.type === 'subtopic') {
                    deleteSubtopic.mutate(deleteItem.id);
                  } else if (deleteItem.type === 'lesson') {
                    deleteLesson.mutate(deleteItem.id);
                  }
                  setDeleteItem(null);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TopicCardProps {
  topic: Topic;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateSubtopic: (title: string) => void;
  onEditSubtopic: (id: string, title: string) => void;
  onDeleteSubtopic: (id: string, title: string) => void;
  onReorderSubtopics: (ids: string[]) => void;
  expandedSubtopics: Set<string>;
  onToggleSubtopic: (id: string) => void;
  onCreateLesson: (subtopicId: string, title: string, type: string) => void;
  onUpdateLesson: (id: string, data: any) => void;
  onDeleteLesson: (id: string, title: string) => void;
  onReorderLessons: (subtopicId: string, ids: string[]) => void;
  accessToken?: string;
}

function TopicCard({
  topic,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onCreateSubtopic,
  onEditSubtopic,
  onDeleteSubtopic,
  onReorderSubtopics,
  expandedSubtopics,
  onToggleSubtopic,
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
  onReorderLessons,
  accessToken,
}: TopicCardProps) {
  const [newSubtopicTitle, setNewSubtopicTitle] = useState('');

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
            <button
              type="button"
              className="flex items-center gap-2 font-medium hover:text-primary"
              onClick={onToggle}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {topic.title}
              <Badge variant="outline">{topic.subtopics?.length || 0} subtopics</Badge>
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3 pt-0">
          <div className="flex gap-2">
            <Input
              placeholder="New subtopic title"
              value={newSubtopicTitle}
              onChange={(e) => setNewSubtopicTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newSubtopicTitle.trim()) {
                  onCreateSubtopic(newSubtopicTitle.trim());
                  setNewSubtopicTitle('');
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                if (newSubtopicTitle.trim()) {
                  onCreateSubtopic(newSubtopicTitle.trim());
                  setNewSubtopicTitle('');
                }
              }}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Subtopic
            </Button>
          </div>

          {topic.subtopics?.map((subtopic) => (
            <SubtopicCard
              key={subtopic.id}
              subtopic={subtopic}
              isExpanded={expandedSubtopics.has(subtopic.id)}
              onToggle={() => onToggleSubtopic(subtopic.id)}
              onEdit={() => onEditSubtopic(subtopic.id, subtopic.title)}
              onDelete={() => onDeleteSubtopic(subtopic.id, subtopic.title)}
              onCreateLesson={(title, type) => onCreateLesson(subtopic.id, title, type)}
              onUpdateLesson={onUpdateLesson}
              onDeleteLesson={onDeleteLesson}
              onReorderLessons={(ids) => onReorderLessons(subtopic.id, ids)}
              accessToken={accessToken}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

interface SubtopicCardProps {
  subtopic: Subtopic;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateLesson: (title: string, type: string) => void;
  onUpdateLesson: (id: string, data: any) => void;
  onDeleteLesson: (id: string, title: string) => void;
  onReorderLessons: (ids: string[]) => void;
  accessToken?: string;
}

function SubtopicCard({
  subtopic,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onCreateLesson,
  onUpdateLesson,
  onDeleteLesson,
  onReorderLessons,
  accessToken,
}: SubtopicCardProps) {
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState('MARKDOWN');

  return (
    <div className="border-l-2 border-muted pl-4 space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-2 font-medium text-sm hover:text-primary"
          onClick={onToggle}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {subtopic.title}
          <Badge variant="outline" className="text-xs">{subtopic.lessons?.length || 0} lessons</Badge>
        </button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}>
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="New lesson title"
              className="h-8 text-sm"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newLessonTitle.trim()) {
                  onCreateLesson(newLessonTitle.trim(), newLessonType);
                  setNewLessonTitle('');
                }
              }}
            />
            <Select value={newLessonType} onValueChange={setNewLessonType}>
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LESSON_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      {type === 'VIDEO' && <Video className="h-3 w-3" />}
                      {type === 'MARKDOWN' && <FileText className="h-3 w-3" />}
                      {type === 'CODING' && <Code className="h-3 w-3" />}
                      {type}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (newLessonTitle.trim()) {
                  onCreateLesson(newLessonTitle.trim(), newLessonType);
                  setNewLessonTitle('');
                }
              }}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {subtopic.lessons?.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onEdit={() => onUpdateLesson(lesson.id, { title: lesson.title })}
              onDelete={() => onDeleteLesson(lesson.id, lesson.title)}
              accessToken={accessToken}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LessonCardProps {
  lesson: Lesson;
  onEdit: () => void;
  onDelete: () => void;
  accessToken?: string;
}

function LessonCard({ lesson, onEdit, onDelete, accessToken }: LessonCardProps) {
  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="h-3 w-3" />;
      case 'MARKDOWN':
        return <FileText className="h-3 w-3" />;
      case 'CODING':
        return <Code className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <div className="bg-muted/50 rounded p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          <button
            type="button"
            className="flex items-center gap-2 font-medium text-sm hover:text-primary"
            onClick={onEdit}
          >
            {getLessonIcon(lesson.type)}
            {lesson.title}
            <Badge variant="outline" className="text-xs">{lesson.type}</Badge>
          </button>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>

      {lesson.contentBlocks && lesson.contentBlocks.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {lesson.contentBlocks.length} content block{lesson.contentBlocks.length !== 1 ? 's' : ''}
        </div>
      )}

      {lesson.quizzes && lesson.quizzes.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {lesson.quizzes.length} quiz{lesson.quizzes.length !== 1 ? 'zes' : ''}
        </div>
      )}

      {lesson.exercises && lesson.exercises.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {lesson.exercises.length} exercise{lesson.exercises.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
