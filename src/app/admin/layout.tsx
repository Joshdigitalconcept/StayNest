'use client';

import * as React from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Shield, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from './components/sidebar';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

// Ensure admin panel is always dynamically rendered
export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const adminRoleRef = useMemoFirebase(
    () => (user ? doc(firestore, 'roles_admin', user.uid) : null),
    [user, firestore]
  );
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole;

  const isLoading = isUserLoading || isAdminRoleLoading;

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
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
        <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] min-h-screen w-full">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block border-r bg-muted/40 h-screen sticky top-0">
                <Sidebar />
            </aside>

            <div className="flex flex-col w-full">
                {/* Mobile Header */}
                <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6 md:hidden sticky top-0 z-40">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-72">
                            <Sidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
                        </SheetContent>
                    </Sheet>
                    
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-bold text-sm">Admin Dashboard</span>
                    </div>

                    <ModeToggle />
                </header>

                {/* Desktop Top Nav */}
                <header className="hidden md:flex h-14 items-center justify-end border-b bg-background px-6 lg:h-[60px] sticky top-0 z-40">
                    <ModeToggle />
                </header>

                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    </div>
  );
}
