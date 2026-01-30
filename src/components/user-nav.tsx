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
import { Home, MessageSquare, User, LogOut, Loader2, Heart, Settings, BellRing } from 'lucide-react';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { collection, collectionGroup, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

export function UserNav() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for unread messages across all bookings for the badge
  const unreadMessagesQuery = useMemoFirebase(
    () => (user && firestore) ? query(
        collectionGroup(firestore, 'messages'),
        where('receiverId', '==', user.uid),
        where('isRead', '==', false)
    ) : null,
    [user, firestore]
  );
  const { data: unreadMessages } = useCollection(unreadMessagesQuery);
  const unreadCount = unreadMessages?.length || 0;

  // Listen for pending reservations where user is the host
  const pendingReservationsQuery = useMemoFirebase(
    () => (user && firestore) ? query(
        collection(firestore, 'bookings'),
        where('hostId', '==', user.uid),
        where('status', '==', 'pending')
    ) : null,
    [user, firestore]
  );
  const { data: pendingReservations } = useCollection(pendingReservationsQuery);
  const pendingCount = pendingReservations?.length || 0;

  const totalNotifications = unreadCount + pendingCount;

  const handleLogout = async () => {
    await signOut(auth);
    toast({
        title: 'Logged Out',
        description: 'You have been successfully signed out.',
    });
    router.push('/');
  };

  if (!mounted || isUserLoading) {
    return <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />;
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
        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
          <Avatar className="h-9 w-9">
            {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User avatar'} />}
            <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
          </Avatar>
          {totalNotifications > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white text-[8px] text-white font-bold items-center justify-center">
                    {totalNotifications}
                </span>
            </span>
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
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-4 px-1 text-[10px]">{unreadCount}</Badge>
              )}
            </Link>
          </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/profile?tab=reservations" className="flex justify-between items-center">
                    <div className="flex items-center">
                        <BellRing className="mr-2 h-4 w-4" />
                        <span>Reservations</span>
                    </div>
                    {pendingCount > 0 && (
                        <Badge variant="destructive" className="h-4 px-1 text-[10px]">{pendingCount}</Badge>
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
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
