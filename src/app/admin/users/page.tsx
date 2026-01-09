
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
import { Loader2, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

function UsersTable({ users, isLoading }: { users: User[] | null, isLoading: boolean }) {
  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;
  if (!users) return <p className="text-muted-foreground">No users found.</p>;
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.id}>
            <TableCell className="flex items-center gap-3">
               <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profilePictureUrl} />
                  <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
               </Avatar>
              <span>{user.firstName} {user.lastName}</span>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              {user.isHost && <Badge variant="secondary">Host</Badge>}
            </TableCell>
            <TableCell>
               <Button variant="ghost" size="icon" asChild>
                <Link href={`/users/${user.id}`} target="_blank">
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

    const usersQuery = useMemoFirebase(
      () => collection(firestore, 'users'),
      [firestore]
    );
    const { data: users, isLoading: usersLoading, error: usersError } = useCollection<User>(usersQuery);

    if (usersError) {
      return (
         <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Permission Error</CardTitle>
            <CardDescription>
              There was an error fetching user data. Please check your Firestore Security Rules to ensure admins have list access to the 'users' collection.
            </CardDescription>
          </CardHeader>
      </Card>
      )
  }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground">
                    Here you can view, filter, and manage all users on the platform.
                </p>
            </div>
             <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>A list of all registered users in the system.</CardDescription>
              </CardHeader>
              <CardContent>
                <UsersTable users={users} isLoading={usersLoading} />
              </CardContent>
            </Card>
        </div>
    )
}
