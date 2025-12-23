'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
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
import { Loader2, Trash2, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// We need a more complete Property type for the listings table
interface AdminProperty {
    id: string;
    title: string;
    location: string;
    host: {
        name: string;
    };
}


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
            <TableCell>{user.isHost ? 'Host' : 'Guest'}</TableCell>
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

function ListingsTable({ listings, isLoading }: { listings: AdminProperty[] | null, isLoading: boolean }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (listingId: string) => {
    setDeletingId(listingId);
    const docRef = doc(firestore, 'listings', listingId);
    try {
      await deleteDoc(docRef);
      toast({ title: 'Success', description: 'Listing deleted successfully.'});
    } catch(error) {
       const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete listing.' });
    } finally {
      setDeletingId(null);
    }
  };


  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;
  if (!listings) return <p className="text-muted-foreground">No listings found.</p>;

  return (
     <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Listing</TableHead>
          <TableHead>Host</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {listings.map(listing => (
          <TableRow key={listing.id}>
            <TableCell className="font-medium">{listing.title}</TableCell>
            <TableCell>{listing.host?.name || 'N/A'}</TableCell>
            <TableCell>{listing.location}</TableCell>
            <TableCell className="flex gap-1">
               <Button variant="ghost" size="icon" asChild>
                <Link href={`/properties/${listing.id}`} target="_blank">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
               <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the listing "{listing.title}". This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(listing.id)}
                      disabled={deletingId === listing.id}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {deletingId === listing.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}


export function AdminSection({ isAdmin }: { isAdmin: boolean }) {
  const firestore = useFirestore();

  // IMPORTANT: Conditionally execute queries only if the user is an admin.
  // Passing `null` to useCollection will prevent it from running.
  const usersQuery = useMemoFirebase(
    () => (isAdmin ? collection(firestore, 'users') : null),
    [firestore, isAdmin]
  );
  const listingsQuery = useMemoFirebase(
    () => (isAdmin ? collection(firestore, 'listings') : null),
    [firestore, isAdmin]
  );

  const { data: users, isLoading: usersLoading, error: usersError } = useCollection<User>(usersQuery);
  const { data: listings, isLoading: listingsLoading, error: listingsError } = useCollection<AdminProperty>(listingsQuery);

  // This check is important. If the component renders before the isAdmin prop is confirmed,
  // or if a non-admin somehow sees this, we show a permission error.
  if (!isAdmin) {
    return (
      <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Permission Denied</CardTitle>
            <CardDescription>
              You do not have the required permissions to view this dashboard. Access is restricted to administrators.
            </CardDescription>
          </CardHeader>
      </Card>
    )
  }
  
  // Show a more specific error if Firestore rules deny access even when isAdmin is true
  if (usersError || listingsError) {
      return (
         <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Permission Error</CardTitle>
            <CardDescription>
              There was an error fetching administrative data. Please check your Firestore Security Rules to ensure admins have list access to 'users' and 'listings' collections.
            </CardDescription>
          </CardHeader>
      </Card>
      )
  }

  return (
    <div className="space-y-8">
      <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage all users on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable users={users} isLoading={usersLoading} />
          </CardContent>
        </Card>
        
        <Card>
           <CardHeader>
            <CardTitle>Listing Management</CardTitle>
            <CardDescription>View and moderate all listings on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <ListingsTable listings={listings} isLoading={listingsLoading} />
          </CardContent>
        </Card>
    </div>
  );
}
