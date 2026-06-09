'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  BarChart3,
  BookOpen,
  Code,
  DollarSign,
  GraduationCap,
  Home,
  MessageSquare,
  Settings,
  Shield,
  Trophy,
  Users,
  FileText,
  Flag,
  Bell,
  Bookmark,
  Heart,
  PlusCircle,
} from 'lucide-react';

const studentLinks = [
  { href: '/student', icon: Home, label: 'Dashboard' },
  { href: '/student/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/student/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { href: '/student/wishlist', icon: Heart, label: 'Wishlist' },
  { href: '/student/certificates', icon: Trophy, label: 'Certificates' },
  { href: '/student/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/student/notifications', icon: Bell, label: 'Notifications' },
  { href: '/student/settings', icon: Settings, label: 'Settings' },
];

const teacherLinks = [
  { href: '/teacher', icon: Home, label: 'Dashboard' },
  { href: '/teacher/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/teacher/courses/new', icon: PlusCircle, label: 'Create Course' },
  { href: '/teacher/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/teacher/revenue', icon: DollarSign, label: 'Revenue' },
  { href: '/teacher/students', icon: Users, label: 'Students' },
  { href: '/teacher/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/teacher/settings', icon: Settings, label: 'Settings' },
];

const adminLinks = [
  { href: '/admin', icon: Home, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/courses', icon: BookOpen, label: 'Courses' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/payouts', icon: DollarSign, label: 'Payouts' },
  { href: '/admin/challenges', icon: Code, label: 'Challenges' },
  { href: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
  { href: '/admin/feature-flags', icon: Flag, label: 'Feature Flags' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const links =
    user?.activeRole === 'ADMIN'
      ? adminLinks
      : user?.activeRole === 'TEACHER'
        ? teacherLinks
        : studentLinks;

  const roleIcon =
    user?.activeRole === 'ADMIN' ? Shield : user?.activeRole === 'TEACHER' ? GraduationCap : BookOpen;
  const RoleIcon = roleIcon;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-background h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <RoleIcon className="h-4 w-4" />
          <span>{user?.activeRole} Mode</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
