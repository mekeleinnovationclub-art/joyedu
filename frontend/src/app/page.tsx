'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import {
  ArrowRight,
  BookOpen,
  Code,
  GraduationCap,
  Layout,
  PlayCircle,
  Shield,
  Star,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Rich Course Library',
    description: 'Access thousands of courses across development, design, business, and more.',
  },
  {
    icon: Code,
    title: 'Interactive Playground',
    description: 'Practice coding with our W3Schools-style live editor with instant feedback.',
  },
  {
    icon: Trophy,
    title: 'Earn Certificates',
    description: 'Complete courses and earn verifiable certificates to showcase your skills.',
  },
  {
    icon: Layout,
    title: 'Dual-Role Accounts',
    description: 'Switch between student and teacher modes with a single account, like Upwork.',
  },
  {
    icon: PlayCircle,
    title: 'Video Lessons',
    description: 'High-quality video content with progress tracking and bookmarks.',
  },
  {
    icon: Shield,
    title: 'Secure Platform',
    description: 'Enterprise-grade security with 2FA, encrypted data, and role-based access.',
  },
];

const stats = [
  { value: '10K+', label: 'Students' },
  { value: '500+', label: 'Courses' },
  { value: '100+', label: 'Instructors' },
  { value: '50K+', label: 'Certificates Issued' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center space-y-6"
            >
              <Badge variant="secondary" className="text-sm px-4 py-1">
                <Zap className="h-3 w-3 mr-1" />
                The Future of Online Education
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Learn, Teach, and{' '}
                <span className="text-primary">Code with Joy</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                A modern education platform combining the best of Udemy, Coursera, and W3Schools.
                One account, multiple roles, unlimited potential.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="lg" variant="outline" className="gap-2">
                    Browse Courses
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-y bg-muted/50">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                  <p className="text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Everything You Need to Learn and Teach</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                A comprehensive platform designed for modern education, with tools for students,
                teachers, and administrators.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full hover:shadow-md transition-shadow">
                      <CardContent className="p-6 space-y-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container text-center space-y-6">
            <GraduationCap className="h-12 w-12 mx-auto" />
            <h2 className="text-3xl font-bold">Ready to Start Your Learning Journey?</h2>
            <p className="max-w-xl mx-auto opacity-90">
              Join thousands of students and teachers on JoyEdu. Start learning today or share
              your knowledge with the world.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="gap-2">
                  <Users className="h-4 w-4" />
                  Sign Up Free
                </Button>
              </Link>
              <Link href="/courses">
                <Button size="lg" variant="outline" className="gap-2 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  <Star className="h-4 w-4" />
                  Explore Courses
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
