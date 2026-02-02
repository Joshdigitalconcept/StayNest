
'use client';

import Header from '@/components/header';
import { Footer } from '@/components/footer';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function AppBody({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminRoute = pathname.startsWith('/admin');
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isCreateListingRoute = pathname.startsWith('/host/create');


    const showHeader = !isAdminRoute && !isAuthRoute && !isCreateListingRoute;
    const showFooter = !isAdminRoute && !isAuthRoute && !isCreateListingRoute;

    return (
        <div className="flex flex-col min-h-screen">
            {showHeader && <Header />}
            <main className="flex-1">
                {children}
            </main>
            {showFooter && <Footer />}
        </div>
    );
}
