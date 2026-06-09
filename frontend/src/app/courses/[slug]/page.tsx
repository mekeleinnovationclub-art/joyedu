'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Globe,
  PlayCircle,
  Star,
  Users,
  FileText,
  Code,
  Loader2,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { triggerTelebirrPayment, isTelebirrSuperApp } from '@/lib/telebirr';
import type { Course } from '@/types';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const slug = params.slug as string;

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api.get<Course>(`/courses/slug/${slug}`),
  });

  const createTelebirrOrderMutation = useMutation({
    mutationFn: (data: { courseId: string; amount: number; title: string }) =>
      api.post('/payments/telebirr/create-order', data, { token: accessToken || undefined }),
    onSuccess: (response: any) => {
      // Define global callback for Telebirr
      (window as any).handleTelebirrPaymentCallback = (result: any) => {
        console.log('Telebirr callback received:', result);
        // Redirect to payment status page with merchantOrderId
        router.push(`/payment/telebirr/status?merchantOrderId=${response.merchantOrderId}`);
      };

      // Trigger Telebirr payment
      const success = triggerTelebirrPayment(response.rawRequest);
      if (!success) {
        alert('Failed to open Telebirr payment. Please ensure you are using the Telebirr SuperApp.');
      }
    },
    onError: (error: Error) => {
      alert(`Payment Error: ${error.message}`);
    },
  });

  const createStripeCheckoutMutation = useMutation({
    mutationFn: (data: { courseId: string; couponCode?: string }) =>
      api.post('/payments/checkout', data, { token: accessToken || undefined }),
    onSuccess: (response: any) => {
      // Redirect to Stripe checkout URL
      if (response.url) {
        window.location.href = response.url;
      }
    },
    onError: (error: Error) => {
      alert(`Payment Error: ${error.message}`);
    },
  });

  const handlePurchase = () => {
    if (!accessToken) {
      alert('Please log in to purchase this course.');
      router.push('/auth/login');
      return;
    }

    if (!course) return;

    // If in Telebirr SuperApp, use Telebirr payment
    if (isTelebirr) {
      const amount = course.discountPrice || course.price;
      createTelebirrOrderMutation.mutate({
        courseId: course.id,
        amount: Number(amount),
        title: course.title,
      });
    } else {
      // Use Stripe for desktop browsers
      createStripeCheckoutMutation.mutate({
        courseId: course.id,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-8 space-y-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-8 text-center">
          <h1 className="text-2xl font-bold">Course not found</h1>
        </main>
      </div>
    );
  }

  const lessonTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <PlayCircle className="h-4 w-4" />;
      case 'MARKDOWN': return <FileText className="h-4 w-4" />;
      case 'CODING': return <Code className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const isTelebirr = isTelebirrSuperApp();
  const isPurchasing = createTelebirrOrderMutation.isPending || createStripeCheckoutMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
          <div className="container">
            <div className="max-w-3xl space-y-4">
              <div className="flex gap-2">
                <Badge variant="secondary">{course.difficulty}</Badge>
                {course.category && <Badge variant="outline">{course.category.name}</Badge>}
                {isTelebirr && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Telebirr Enabled</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">{course.title}</h1>
              {course.subtitle && (
                <p className="text-lg text-muted-foreground">{course.subtitle}</p>
              )}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course._count?.enrollments || 0} students
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {course._count?.reviews || 0} reviews
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {course.language}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.duration}h
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={course.instructor.avatar || undefined} />
                  <AvatarFallback>
                    {course.instructor.firstName[0]}{course.instructor.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{course.instructor.firstName} {course.instructor.lastName}</p>
                  <p className="text-xs text-muted-foreground">Instructor</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About this course</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{course.description}</p>
                </CardContent>
              </Card>

              {/* Learning Goals */}
              {course.learningGoals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>What you&apos;ll learn</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {course.learningGoals.map((goal, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                          <span className="text-sm">{goal}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Curriculum */}
              {course.chapters && course.chapters.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Course Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {course.chapters.map((chapter) => (
                      <div key={chapter.id}>
                        <h4 className="font-medium mb-2">{chapter.title}</h4>
                        <div className="space-y-1 ml-4">
                          {chapter.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between py-2 text-sm">
                              <div className="flex items-center gap-2">
                                {lessonTypeIcon(lesson.type)}
                                <span>{lesson.title}</span>
                                {lesson.isFree && <Badge variant="secondary" className="text-xs">Free</Badge>}
                              </div>
                              {lesson.videoDuration && (
                                <span className="text-muted-foreground">{lesson.videoDuration}m</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <Separator className="mt-3" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <Card className="sticky top-20">
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    {course.price > 0 ? (
                      <div className="space-y-1">
                        {course.discountPrice ? (
                          <>
                            <p className="text-4xl font-bold">{formatPrice(course.discountPrice)}</p>
                            <p className="text-lg text-muted-foreground line-through">{formatPrice(course.price)}</p>
                          </>
                        ) : (
                          <p className="text-4xl font-bold">{formatPrice(course.price)}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-4xl font-bold text-green-600">Free</p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : course.price > 0 ? (
                      isTelebirr ? 'Buy with Telebirr' : 'Buy with Stripe'
                    ) : (
                      'Enroll Free'
                    )}
                  </Button>

                  {isTelebirr && course.price > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Powered by Telebirr
                    </p>
                  )}

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <h4 className="font-semibold">This course includes:</h4>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <PlayCircle className="h-4 w-4" />
                      <span>{course.duration} hours of content</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.chapters?.reduce((sum, ch) => sum + ch.lessons.length, 0) || 0} lessons</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Star className="h-4 w-4" />
                      <span>Certificate of completion</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
