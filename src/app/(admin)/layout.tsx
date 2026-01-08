'use client';

import * as React from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from './components/sidebar';
import { cn } from '@/lib/utils';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const adminRoleRef = useMemoFirebase(
    () => (user ? doc(firestore, 'roles_admin', user.uid) : null),
    [user, firestore]
  );
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole;

  const isLoading = isUserLoading || isAdminRoleLoading;

  React.useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/login');
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying administrator access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
       <div className="flex h-screen w-full flex-col items-center justify-center bg-muted">
        <Shield className="h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          You do not have permission to view this page.
        </p>
         <button onClick={() => router.push('/')} className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground">
            Go to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-muted/40">
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <Sidebar />
            <div className="flex flex-col">
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    </div>
  );
}
