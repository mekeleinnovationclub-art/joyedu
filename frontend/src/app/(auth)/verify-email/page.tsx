'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <Link href="/" className="flex justify-center mb-4">
            <GraduationCap className="h-10 w-10 text-primary" />
          </Link>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We&apos;ve sent a verification link to your email. Click the link to verify your account
            and start learning.
          </p>
          <Link href="/login">
            <Button variant="outline" className="mt-4">Go to Login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
