
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, MessageSquare, User, LogOut, Loader2, Heart, Settings } from 'lucide-react';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Badge } from './ui/badge';
import React from 'react';

export function UserNav() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isUnreadLoading, setIsUnreadLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user || !firestore) {
      setIsUnreadLoading(false);
      return;
    }

    const fetchUnreadMessages = async () => {
      setIsUnreadLoading(true);
      try {
        // Fetch all bookings where the user is either a guest or a host
        const guestBookingsQuery = query(collection(firestore, 'bookings'), where('guestId', '==', user.uid));
        const hostBookingsQuery = query(collection(firestore, 'bookings'), where('hostId', '==', user.uid));

        const [guestBookingsSnap, hostBookingsSnap] = await Promise.all([
          getDocs(guestBookingsQuery),
          getDocs(hostBookingsQuery),
        ]);
        
        const bookingIds = new Set<string>();
        guestBookingsSnap.forEach(doc => bookingIds.add(doc.id));
        hostBookingsSnap.forEach(doc => bookingIds.add(doc.id));

        if (bookingIds.size === 0) {
          setUnreadCount(0);
          setIsUnreadLoading(false);
          return;
        }

        let totalUnread = 0;
        
        // Create a promise for each booking's unread message query
        const unreadPromises = Array.from(bookingIds).map(bookingId => {
          const messagesQuery = query(
            collection(firestore, `bookings/${bookingId}/messages`),
            where('receiverId', '==', user.uid),
            where('isRead', '==', false)
          );
          return getDocs(messagesQuery);
        });

        // Wait for all queries to complete
        const unreadSnapshots = await Promise.all(unreadPromises);

        // Sum up the results
        unreadSnapshots.forEach(snapshot => {
          totalUnread += snapshot.size;
        });

        setUnreadCount(totalUnread);

      } catch (e) {
        console.error("Failed to fetch unread messages count:", e);
        setUnreadCount(0);
      } finally {
        setIsUnreadLoading(false);
      }
    };
    
    fetchUnreadMessages();
  }, [user, firestore]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (isUserLoading) {
    return <Loader2 className="animate-spin" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">Log In</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User avatar'} />}
            <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
          </Avatar>
           {unreadCount > 0 && (
            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/favorites">
                <Heart className="mr-2 h-4 w-4" />
                <span>Favorites</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/messages" className="flex justify-between items-center">
              <div className="flex items-center">
                 <MessageSquare className="mr-2 h-4 w-4" />
                <span>Messages</span>
              </div>
              {!isUnreadLoading && unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center">{unreadCount}</Badge>
              )}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile?tab=bookings">
              <Home className="mr-2 h-4 w-4" />
              <span>My Bookings</span>
            </Link>
          </DropdownMenuItem>
           <DropdownMenuItem asChild>
            <Link href="/account">
              <Settings className="mr-2 h-4 w-4" />
              <span>Account</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
