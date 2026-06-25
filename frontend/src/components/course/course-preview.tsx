'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, BookOpen, Layers, FileText, HelpCircle, Dumbbell,
  PlayCircle, Clock, Users, Star, ChevronRight, ChevronDown
} from 'lucide-react';

interface CoursePreviewProps {
  courseId: string;
  accessToken?: string;
  onEdit?: () => void;
  onClose?: () => void;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  difficulty: string;
  duration: number;
  price: number;
  discountPrice?: number;
  learningGoals?: string[];
  requirements?: string[];
  tags?: string[];
  instructor?: {
    name: string;
    avatar?: string;
  };
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
  type: string;
  duration?: number;
  isFree: boolean;
  contentBlocks?: any[];
  quizzes?: any[];
  exercises?: any[];
}

export function CoursePreview({ courseId, accessToken, onEdit, onClose }: CoursePreviewProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
  });

  const { data: structure } = useQuery<{ topics: Topic[] }>({
    queryKey: ['course-structure', courseId],
    queryFn: () => api.get(`/course-structure/courses/${courseId}/structure`, { token: accessToken }),
    enabled: !!courseId && !!accessToken,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Course Preview</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>
            Edit Course
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Course Hero */}
          <Card>
            <CardContent className="p-0">
              <div className="relative">
                {course?.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <Badge variant="secondary" className="mb-2">{course?.difficulty}</Badge>
                  <h1 className="text-3xl font-bold text-white mb-2">{course?.title}</h1>
                  <p className="text-white/80 line-clamp-2">{course?.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <Clock className="h-5 w-5 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold">{Math.floor((course?.duration || 0) / 60)}h</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Layers className="h-5 w-5 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold">{structure?.topics.length || 0}</p>
                <p className="text-sm text-muted-foreground">Topics</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <FileText className="h-5 w-5 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold">
                  {structure?.topics.reduce((acc, t) => acc + t.subtopics.reduce((acc2, s) => acc2 + s.lessons.length, 0), 0) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Lessons</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Users className="h-5 w-5 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold">-</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </CardContent>
            </Card>
          </div>

          {/* Price */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">
                  ${course?.discountPrice || course?.price || 0}
                </span>
                {course?.discountPrice && course.price && (
                  <span className="text-xl text-muted-foreground line-through">
                    ${course.price}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-4">
          {structure?.topics.map((topic) => (
            <Card key={topic.id}>
              <CardHeader className="pb-3">
                <button
                  type="button"
                  className="flex items-center gap-2 w-full"
                  onClick={() => toggleTopic(topic.id)}
                >
                  {expandedTopics.has(topic.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium">{topic.title}</span>
                  <Badge variant="outline">{topic.subtopics.length} subtopics</Badge>
                </button>
              </CardHeader>

              {expandedTopics.has(topic.id) && (
                <CardContent className="pt-0 space-y-3">
                  {topic.subtopics.map((subtopic) => (
                    <div key={subtopic.id} className="border-l-2 pl-4 space-y-2">
                      <button
                        type="button"
                        className="flex items-center gap-2 w-full text-sm"
                        onClick={() => toggleSubtopic(subtopic.id)}
                      >
                        {expandedSubtopics.has(subtopic.id) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        <span className="font-medium">{subtopic.title}</span>
                        <Badge variant="outline" className="text-xs">{subtopic.lessons.length} lessons</Badge>
                      </button>

                      {expandedSubtopics.has(subtopic.id) && (
                        <div className="space-y-1 ml-4">
                          {subtopic.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted">
                              {lesson.type === 'VIDEO' && <PlayCircle className="h-4 w-4" />}
                              {lesson.type === 'MARKDOWN' && <FileText className="h-4 w-4" />}
                              {lesson.type === 'CODING' && <Code className="h-4 w-4" />}
                              <span>{lesson.title}</span>
                              {lesson.isFree && <Badge variant="secondary" className="text-xs">Free</Badge>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* Learning Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                What You'll Learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {course?.learningGoals?.map((goal, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {course?.requirements?.map((req, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {course?.tags?.map((tag, index) => (
                  <Badge key={index} variant="outline">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Code({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
