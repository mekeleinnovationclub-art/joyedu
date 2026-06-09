'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleSwitcher } from '@/components/common/role-switcher';
import {
  BookOpen,
  Code,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from 'next-themes';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.activeRole) {
      case 'TEACHER':
        return '/teacher';
      case 'ADMIN':
        return '/admin';
      default:
        return '/student';
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span>JoyEdu</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <BookOpen className="h-4 w-4 inline mr-1" />
              Courses
            </Link>
            <Link href="/playground" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Code className="h-4 w-4 inline mr-1" />
              Playground
            </Link>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <RoleSwitcher />

              <Link href={getDashboardLink()}>
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
              </Link>

              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback>
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t p-4 space-y-3">
          <Link href="/courses" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
            Courses
          </Link>
          <Link href="/playground" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
            Playground
          </Link>
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 py-2">
                <RoleSwitcher compact />
              </div>
              <Link href={getDashboardLink()} className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="block">
                <Button variant="ghost" size="sm" className="w-full">Sign In</Button>
              </Link>
              <Link href="/register" className="block">
                <Button size="sm" className="w-full">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
