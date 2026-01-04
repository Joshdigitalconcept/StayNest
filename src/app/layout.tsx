import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Header from '@/components/header';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import React from 'react';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'StayNest - Find Your Perfect Getaway',
  description: 'Book unique homes and experiences all over the world.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-body antialiased', ptSans.variable)}>
        <FirebaseClientProvider>
          <Header />
          <main className="flex-1">
             <React.Suspense fallback={<div>Loading...</div>}>
                {children}
            </React.Suspense>
          </main>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
