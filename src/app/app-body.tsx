
'use client';

import Header from '@/components/header';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function AppBody({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminRoute = pathname.startsWith('/admin');
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isCreateListingRoute = pathname.startsWith('/host/create');


    const showHeader = !isAdminRoute && !isAuthRoute && !isCreateListingRoute;

    return (
        <>
            {showHeader && <Header />}
            {children}
        </>
    );
}
