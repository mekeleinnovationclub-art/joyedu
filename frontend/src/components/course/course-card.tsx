'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Star, Users } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { Course } from '@/types';

interface CourseCardProps {
  course: Course;
  index?: number;
}

export function CourseCard({ course, index = 0 }: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/courses/${course.slug}`}>
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
          <div className="relative aspect-video overflow-hidden bg-muted">
            {course.thumbnail ? (
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            {course.discountPrice && (
              <Badge className="absolute top-2 right-2 bg-red-500">Sale</Badge>
            )}
          </div>

          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {course.difficulty}
              </Badge>
              {course.category && (
                <Badge variant="outline" className="text-xs">
                  {course.category.name}
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>

            <p className="text-sm text-muted-foreground">
              {course.instructor.firstName} {course.instructor.lastName}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {course._count?.enrollments || 0}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {course._count?.reviews || 0} reviews
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              {course.price > 0 ? (
                <div className="flex items-center gap-2">
                  {course.discountPrice ? (
                    <>
                      <span className="font-bold text-lg">{formatPrice(course.discountPrice)}</span>
                      <span className="text-sm text-muted-foreground line-through">{formatPrice(course.price)}</span>
                    </>
                  ) : (
                    <span className="font-bold text-lg">{formatPrice(course.price)}</span>
                  )}
                </div>
              ) : (
                <Badge variant="secondary">Free</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
