'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCourse } from '@/hooks/use-courses';
import { useEnrollments } from '@/hooks/use-enrollments';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlayCircle, BookOpen, CheckCircle2, Lock, 
  Clock, Users, Star, Loader2, ChevronRight,
  Video, FileText, HelpCircle, Dumbbell, FolderOpen
} from 'lucide-react';
import { CheckoutFlow } from './checkout-flow';

interface StudentCourseViewProps {
  courseId: string;
  accessToken?: string;
}

export function StudentCourseView({ courseId, accessToken }: StudentCourseViewProps) {
  const { user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);

  const { data: course, isLoading } = useCourse(courseId, {
    enabled: !!courseId && !!accessToken,
  });

  const { data: enrollments } = useEnrollments(user?.id || '', {
    enabled: !!user?.id,
  });

  const enrollment = enrollments?.find(e => e.courseId === courseId);
  const isEnrolled = !!enrollment;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <CheckoutFlow
        courseId={courseId}
        accessToken={accessToken}
        onComplete={() => {
          setShowCheckout(false);
          window.location.reload();
        }}
        onCancel={() => setShowCheckout(false)}
      />
    );
  }

  const finalPrice = course.discountPrice || course.price;

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
            {course.status}
          </Badge>
          <Badge variant="outline">{course.difficulty}</Badge>
        </div>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.description}</p>

        {course.thumbnail && (
          <div className="aspect-video rounded-lg overflow-hidden">
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {course.instructorId}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.duration} minutes
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            4.5 rating
          </span>
        </div>
      </div>

      {/* Course Content */}
      <Tabs defaultValue="curriculum" className="w-full">
        <TabsList>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="space-y-4">
          {isEnrolled ? (
            <Card>
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={enrollment?.progress || 0} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {enrollment?.progress.toFixed(0)}% complete
                </p>
                {enrollment?.completedAt && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <CardTitle>Enroll to Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Enroll in this course to access all lessons, quizzes, and exercises.
                </p>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-2xl font-bold">${finalPrice.toFixed(2)}</span>
                    {course.discountPrice && (
                      <span className="text-sm text-muted-foreground line-through ml-2">
                        ${course.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <Button onClick={() => setShowCheckout(true)}>
                    Enroll Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Curriculum Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Topic 1 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <ChevronRight className="h-4 w-4" />
                  <span>Getting Started</span>
                </div>
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Introduction to the Course</span>
                    {!isEnrolled && <Lock className="h-4 w-4 text-muted-foreground ml-auto" />}
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Setting Up Your Environment</span>
                    {!isEnrolled && <Lock className="h-4 w-4 text-muted-foreground ml-auto" />}
                  </div>
                </div>
              </div>

              {/* Topic 2 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <ChevronRight className="h-4 w-4" />
                  <span>Core Concepts</span>
                </div>
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Understanding the Basics</span>
                    {!isEnrolled && <Lock className="h-4 w-4 text-muted-foreground ml-auto" />}
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Reading Assignment</span>
                    {!isEnrolled && <Lock className="h-4 w-4 text-muted-foreground ml-auto" />}
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Quiz: Core Concepts</span>
                    {!isEnrolled && <Lock className="h-4 w-4 text-muted-foreground ml-auto" />}
                  </div>
                </div>
              </div>

              {/* Topic 3 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <ChevronRight className="h-4 w-4" />
                  <span>Advanced Topics</span>
                </div>
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Practical Exercise</span>
                    {!isEnrolled && <Lock className="h-4 w-4 text-muted-foreground ml-auto" />}
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Project Resources</span>
                    {!isEnrolled && <Lock className="h-4 w-4 text-muted-foreground ml-auto" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About This Course</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What You'll Learn</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {course.learningGoals?.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              </div>

              {course.requirements && course.requirements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {course.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {course.tags && course.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No reviews yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
