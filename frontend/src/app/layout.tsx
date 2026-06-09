import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/common/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'JoyEdu - Modern Education Platform',
    template: '%s | JoyEdu',
  },
  description: 'Learn, teach, and code with joy. The modern education platform for everyone.',
  keywords: ['education', 'online learning', 'coding', 'courses', 'LMS'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
