
'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ExternalLink, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

function UsersTable({ users, isLoading }: { users: User[] | null, isLoading: boolean }) {
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
  if (!users) return <p className="text-muted-foreground p-8 text-center">No users found.</p>;
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead className="hidden md:table-cell">Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="hidden lg:table-cell">Joined</TableHead>
          <TableHead>Verified</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user.profilePictureUrl} />
                    <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="font-medium">{user.firstName} {user.lastName}</div>
              </div>
            </TableCell>
             <TableCell className="hidden md:table-cell">{user.email}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {user.isHost && <Badge variant="secondary">Host</Badge>}
                {!user.isHost && <Badge variant="outline">Guest</Badge>}
              </div>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              {user.createdAt ? format(user.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
            </TableCell>
            <TableCell>
                <Badge variant={user.emailVerified ? 'default' : 'destructive'} className="bg-green-100 text-green-800">Email</Badge>
            </TableCell>
            <TableCell>
               <Button variant="ghost" size="icon" asChild>
                <Link href={`/users/${user.id}`} target="_blank" title="View Public Profile">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdminUsersPage() {
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = React.useState('');

    const usersQuery = useMemoFirebase(
      () => collection(firestore, 'users'),
      [firestore]
    );
    const { data: users, isLoading: usersLoading, error: usersError } = useCollection<User>(usersQuery);

    const filteredUsers = React.useMemo(() => {
        if (!users) return null;
        if (!searchTerm) return users;
        
        const lowercasedTerm = searchTerm.toLowerCase();
        return users.filter(user => 
            user.email?.toLowerCase().includes(lowercasedTerm) ||
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(lowercasedTerm)
        );
    }, [users, searchTerm]);

    if (usersError) {
      return (
         <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Permission Error</CardTitle>
            <CardDescription>
              There was an error fetching user data. Please ensure your account has administrator privileges and that Firestore Security Rules grant admins 'list' access to the 'users' collection.
            </CardDescription>
          </CardHeader>
      </Card>
      )
  }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground">
                    View, filter, and manage all users on the platform.
                </p>
            </div>
             <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>A list of all registered users in the system.</CardDescription>
                    </div>
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name or email..."
                            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <UsersTable users={filteredUsers} isLoading={usersLoading} />
              </CardContent>
            </Card>
        </div>
    )
}
