"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/user-nav";
import { Logo } from "./logo";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import type { User } from '@/lib/types';
import { doc } from "firebase/firestore";

export default function Header() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc<User>(userProfileRef);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-8 w-8" />
            <span className="font-bold sm:inline-block font-headline text-lg">
              StayNest
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {user && (
                userProfile?.isHost ? (
                    <Button variant="ghost" asChild>
                        <Link href="/profile?tab=properties">My Listings</Link>
                    </Button>
                ) : (
                    <Button variant="ghost" asChild>
                        <Link href="/host/create">Become a Host</Link>
                    </Button>
                )
            )}
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
