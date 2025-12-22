"use client";

import Link from "next/link";
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/user-nav";
import { Logo } from "./logo";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import type { User } from '@/lib/types';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Header() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userProfileRef);

  React.useEffect(() => {
    if (user && !isProfileLoading && !userProfile) {
      // User is logged in but has no Firestore profile. Create one.
      const [firstName, ...lastName] = (user.displayName || user.email?.split('@')[0] || 'New').split(' ');
      
      const newUserProfile = {
        id: user.uid,
        firstName: firstName || 'New',
        lastName: lastName.join(' ') || 'User',
        email: user.email,
        profilePictureUrl: user.photoURL || '',
        isHost: false,
        isGuest: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Use setDoc with merge:true to avoid race conditions or overwriting existing data.
      if (userProfileRef) {
        setDoc(userProfileRef, newUserProfile, { merge: true }).catch(console.error);
      }
    }
  }, [user, userProfile, isProfileLoading, userProfileRef]);


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
