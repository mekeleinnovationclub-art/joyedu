'use client';

import { useAuth } from '@/hooks/use-auth';
import { ProtectedRoute } from '@/components/common/route-guards';
import { ApplyTeacherForm } from '@/components/common/apply-teacher-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { canApplyAsTeacher, hasPendingTeacherApplication } from '@/lib/permissions';
import Link from 'next/link';

function TeacherApplicationContent() {
  const { user, teacherApplication } = useAuth();

  if (!user) return null;

  const canApply = canApplyAsTeacher(user, teacherApplication?.status);
  const isPending = hasPendingTeacherApplication(user, teacherApplication?.status);
  const isApproved = teacherApplication?.status === 'APPROVED';
  const isRejected = teacherApplication?.status === 'REJECTED';

  if (isApproved) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teacher Application</h1>
          <p className="text-muted-foreground mt-1">Your application has been approved!</p>
        </div>

        <Card className="border-green-200 dark:border-green-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-green-700 dark:text-green-400">Congratulations!</CardTitle>
                <CardDescription>
                  You are now a teacher on JoyEdu. Switch to Teacher mode to start creating courses.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/teacher">
              <Button className="w-full">
                Switch to Teacher Mode
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teacher Application</h1>
          <p className="text-muted-foreground mt-1">Your application is under review</p>
        </div>

        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-yellow-700 dark:text-yellow-400">Application Pending</CardTitle>
                <CardDescription>
                  Your teacher application is being reviewed by our team. We'll notify you once a decision is made.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Application Details</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted:</span>
                    <span>{new Date(teacherApplication?.submittedAt || '').toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">Pending Review</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This typically takes 1-3 business days. You can continue learning as a student while you wait.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teacher Application</h1>
          <p className="text-muted-foreground mt-1">Your application was not approved</p>
        </div>

        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-red-700 dark:text-red-400">Application Rejected</CardTitle>
                <CardDescription>
                  Unfortunately, your teacher application was not approved at this time.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teacherApplication?.rejectionReason && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Reason</p>
                  <p className="text-sm text-muted-foreground">{teacherApplication.rejectionReason}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                You can improve your profile and apply again in the future. Continue learning as a student while you prepare.
              </p>
              <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                Apply Again Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show apply form
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Become a Teacher</h1>
        <p className="text-muted-foreground mt-1">Share your knowledge and earn money teaching on JoyEdu</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <FileText className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Create Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Design and publish courses on topics you're passionate about
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <GraduationCap className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Teach Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Reach thousands of students worldwide and help them achieve their goals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CheckCircle className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Earn Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get paid for every enrollment and build a sustainable income stream
            </p>
          </CardContent>
        </Card>
      </div>

      <ApplyTeacherForm />
    </div>
  );
}

export default function TeacherApplicationPage() {
  return (
    <ProtectedRoute>
      <TeacherApplicationContent />
    </ProtectedRoute>
  );
}
