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
import { PlusCircle, Trash2, ChevronDown, ChevronRight, Layers, GripVertical } from 'lucide-react';

const CONTENT_BLOCK_TYPES = [
  'RICH_TEXT', 'MARKDOWN', 'CODE', 'IMAGE', 'VIDEO', 'FILE',
  'EXTERNAL_LINK', 'CALLOUT', 'NOTE', 'SUMMARY', 'EXAMPLE',
  'ASSIGNMENT', 'EXERCISE', 'QUIZ', 'CODING_CHALLENGE',
] as const;

const LESSON_TYPES = ['VIDEO', 'MARKDOWN', 'CODING'] as const;

interface CourseBuilderProps {
  courseId: string;
  accessToken?: string;
}

export function CourseBuilder({ courseId, accessToken }: CourseBuilderProps) {
  const queryClient = useQueryClient();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newSubtopicTitles, setNewSubtopicTitles] = useState<Record<string, string>>({});
  const [newLessonTitles, setNewLessonTitles] = useState<Record<string, string>>({});

  const { data: structure, isLoading } = useQuery<{ topics: any[] }>({
    queryKey: ['course-structure', courseId],
    queryFn: () => api.get(`/courses/${courseId}/structure`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['course-structure', courseId] });
    queryClient.invalidateQueries({ queryKey: ['course', courseId] });
  };

  const createTopic = useMutation({
    mutationFn: (title: string) =>
      api.post('/topics', { courseId, title }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const createSubtopic = useMutation({
    mutationFn: ({ topicId, title }: { topicId: string; title: string }) =>
      api.post('/subtopics', { topicId, title }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const createLesson = useMutation({
    mutationFn: ({ subtopicId, title, type }: { subtopicId: string; title: string; type: string }) =>
      api.post('/lessons', { subtopicId, title, slug: title.toLowerCase().replace(/\s+/g, '-'), type }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const createBlock = useMutation({
    mutationFn: ({ lessonId, type }: { lessonId: string; type: string }) =>
      api.post('/course-structure/content-blocks', {
        lessonId,
        type,
        content: { body: '' },
      }, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteTopic = useMutation({
    mutationFn: (id: string) => api.delete(`/topics/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteSubtopic = useMutation({
    mutationFn: (id: string) => api.delete(`/subtopics/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteLesson = useMutation({
    mutationFn: (id: string) => api.delete(`/lessons/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const deleteBlock = useMutation({
    mutationFn: (id: string) => api.delete(`/course-structure/content-blocks/${id}`, { token: accessToken }),
    onSuccess: invalidate,
  });

  const updateBlock = useMutation({
    mutationFn: ({ id, content }: { id: string; content: Record<string, unknown> }) =>
      api.patch(`/course-structure/content-blocks/${id}`, { content }, { token: accessToken }),
    onSuccess: invalidate,
  });

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

  const toggleLesson = (id: string) => {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading course structure...</div>;
  }

  const topics = structure?.topics || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Course Structure Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New topic title"
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
            />
            <Button
              onClick={() => {
                if (newTopicTitle.trim()) {
                  createTopic.mutate(newTopicTitle.trim());
                  setNewTopicTitle('');
                }
              }}
              disabled={createTopic.isPending}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Topic
            </Button>
          </div>

          {topics.map((topic: any) => (
            <div key={topic.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex items-center gap-2 font-medium"
                  onClick={() => toggleTopic(topic.id)}
                >
                  {expandedTopics.has(topic.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {topic.title}
                  <Badge variant="outline">{topic.subtopics?.length || 0} subtopics</Badge>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTopic.mutate(topic.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              {expandedTopics.has(topic.id) && (
                <div className="ml-6 space-y-3">
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="New subtopic title"
                      value={newSubtopicTitles[topic.id] || ''}
                      onChange={(e) =>
                        setNewSubtopicTitles({ ...newSubtopicTitles, [topic.id]: e.target.value })
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const title = newSubtopicTitles[topic.id]?.trim();
                        if (title) {
                          createSubtopic.mutate({ topicId: topic.id, title });
                          setNewSubtopicTitles({ ...newSubtopicTitles, [topic.id]: '' });
                        }
                      }}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add Subtopic
                    </Button>
                  </div>

                  {(topic.subtopics || []).map((subtopic: any) => (
                    <div key={subtopic.id} className="border-l-2 pl-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          className="flex items-center gap-2 font-medium text-sm"
                          onClick={() => toggleSubtopic(subtopic.id)}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          {expandedSubtopics.has(subtopic.id) ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          {subtopic.title}
                          <Badge variant="outline" className="text-xs">{subtopic.lessons?.length || 0} lessons</Badge>
                        </button>
                        <Button variant="ghost" size="icon" onClick={() => deleteSubtopic.mutate(subtopic.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>

                      {expandedSubtopics.has(subtopic.id) && (
                        <div className="ml-4 space-y-2">
                          <div className="flex gap-2 items-center">
                            <Input
                              placeholder="New lesson title"
                              className="h-8 text-sm"
                              value={newLessonTitles[subtopic.id] || ''}
                              onChange={(e) =>
                                setNewLessonTitles({ ...newLessonTitles, [subtopic.id]: e.target.value })
                              }
                            />
                            <Select
                              defaultValue="MARKDOWN"
                              onValueChange={(type) => {
                                const title = newLessonTitles[subtopic.id]?.trim();
                                if (title) {
                                  createLesson.mutate({ subtopicId: subtopic.id, title, type });
                                  setNewLessonTitles({ ...newLessonTitles, [subtopic.id]: '' });
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 w-[120px]">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {LESSON_TYPES.map((t) => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const title = newLessonTitles[subtopic.id]?.trim();
                                if (title) {
                                  createLesson.mutate({ subtopicId: subtopic.id, title, type: 'MARKDOWN' });
                                  setNewLessonTitles({ ...newLessonTitles, [subtopic.id]: '' });
                                }
                              }}
                            >
                              Add Lesson
                            </Button>
                          </div>

                          {(subtopic.lessons || []).map((lesson: any) => (
                            <div key={lesson.id} className="bg-muted/50 rounded p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  className="flex items-center gap-2 font-medium text-sm"
                                  onClick={() => toggleLesson(lesson.id)}
                                >
                                  {expandedLessons.has(lesson.id) ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                  {lesson.title}
                                  <Badge variant="outline" className="text-xs">{lesson.type}</Badge>
                                </button>
                                <Button variant="ghost" size="icon" onClick={() => deleteLesson.mutate(lesson.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>

                              {expandedLessons.has(lesson.id) && (
                                <div className="space-y-2">
                                  <div className="flex gap-2 items-center">
                                    <Select
                                      onValueChange={(type) =>
                                        createBlock.mutate({ lessonId: lesson.id, type })
                                      }
                                    >
                                      <SelectTrigger className="h-8 w-[200px]">
                                        <SelectValue placeholder="Add content block" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {CONTENT_BLOCK_TYPES.map((t) => (
                                          <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {(lesson.contentBlocks || []).map((block: any) => (
                                    <div key={block.id} className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs">{block.type}</Label>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => deleteBlock.mutate(block.id)}
                                        >
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                      </div>
                                      <Textarea
                                        className="text-sm min-h-[60px]"
                                        value={(block.content as any)?.body || JSON.stringify(block.content)}
                                        onChange={(e) =>
                                          updateBlock.mutate({
                                            id: block.id,
                                            content: { body: e.target.value },
                                          })
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
