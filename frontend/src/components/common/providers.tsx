'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

function AuthInitializer({ children }: { children: ReactNode }) {
  const { isInitializing, isHydrated } = useAuth();
  const pathname = usePathname();

  // Public auth routes that should render immediately without auth loading
  const publicAuthRoutes = ['/login', '/register', '/forgot-password', '/verify-email'];
  const isPublicAuthRoute = publicAuthRoutes.some(route => pathname?.startsWith(route));

  // Skip loading screen for public auth pages - they should render immediately
  if (isPublicAuthRoute) {
    return <>{children}</>;
  }

  if (!isHydrated || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthInitializer>{children}</AuthInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
