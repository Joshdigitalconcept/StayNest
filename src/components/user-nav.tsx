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
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import React from 'react';
import { useToast } from '@/hooks/use-toast';

export function UserNav() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    toast({
        title: 'Logged Out',
        description: 'You have been successfully signed out.',
    });
    router.push('/');
  };

  if (!mounted || isUserLoading) {
    return <Loader2 className="animate-spin h-5 w-5" />;
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
            </Link>
          </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/profile?tab=reservations" className="flex justify-between items-center">
                    <div className="flex items-center">
                        <BellRing className="mr-2 h-4 w-4" />
                        <span>Reservations</span>
                    </div>
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
