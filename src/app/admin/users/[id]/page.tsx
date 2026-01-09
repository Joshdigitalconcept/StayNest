'use client';

import * as React from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError, useUser } from '@/firebase';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { User as UserType } from '@/lib/types';
import { Loader2, ArrowLeft, Shield, Check, X, Building, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { format, formatDistanceToNow } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
} from "@/components/ui/alert-dialog"

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export default function AdminUserProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user: adminUser } = useUser(); // The currently logged-in admin

  // Fetch the user being viewed
  const userDocRef = useMemoFirebase(
    () => (firestore && id) ? doc(firestore, 'users', id) : null,
    [firestore, id]
  );
  const { data: user, isLoading: isUserLoading, setData: setUser } = useDoc<UserType>(userDocRef);

  // Check if the viewed user is an admin
  const adminRoleRef = useMemoFirebase(
    () => (firestore && id) ? doc(firestore, 'roles_admin', id) : null,
    [firestore, id]
  );
  const { data: userAdminRole, isLoading: isAdminRoleLoading, setData: setAdminRole } = useDoc(adminRoleRef);
  const isUserAdmin = !!userAdminRole;


  const handleHostToggle = async (isHost: boolean) => {
    if (!userDocRef || !user) return;

    try {
      await updateDoc(userDocRef, { isHost });
      setUser({ ...user, isHost });
      toast({
        title: 'Success!',
        description: `${user.firstName}'s host privileges have been ${isHost ? 'granted' : 'revoked'}.`,
      });
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: { isHost },
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    }
  };
  
   const handleAdminToggle = async (makeAdmin: boolean) => {
    if (!adminRoleRef || !user) return;
    if (user.id === adminUser?.uid) {
        toast({ variant: 'destructive', title: 'Action not allowed', description: 'You cannot change your own admin status.' });
        return;
    }

    try {
        if (makeAdmin) {
            await setDoc(adminRoleRef, { grantedAt: serverTimestamp(), by: adminUser?.email });
            setAdminRole({ grantedAt: new Date() });
            toast({ title: 'Success!', description: `${user.firstName} is now an administrator.` });
        } else {
            await deleteDoc(adminRoleRef);
            setAdminRole(null);
            toast({ title: 'Success!', description: `${user.firstName} is no longer an administrator.` });
        }
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message,
        });
    }
  };


  const isLoading = isUserLoading || isAdminRoleLoading;

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  if (!user && !isLoading) {
    notFound();
  }

  return (
    <div className="space-y-6">
       <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center text-center">
               <Avatar className="h-24 w-24 mb-2">
                <AvatarImage src={user.profilePictureUrl} />
                <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{user.firstName} {user.lastName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <InfoRow label="User ID" value={<span className="font-mono text-xs">{user.id}</span>} />
               <InfoRow label="Phone Number" value={user.phone || 'Not provided'} />
               <InfoRow label="Location" value={user.live || 'Not provided'} />
               <InfoRow label="Joined" value={user.createdAt ? format(user.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'} />
               <InfoRow label="Last Active" value={user.lastActive ? formatDistanceToNow(user.lastActive.toDate(), { addSuffix: true }) : 'N/A'} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Management Cards */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Roles & Capabilities</CardTitle>
                    <CardDescription>Manage this user's platform roles and privileges.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="is-guest" className="text-base flex items-center gap-2"><UserIcon /> Is Guest</Label>
                            <p className="text-sm text-muted-foreground">All users are guests by default.</p>
                        </div>
                        <Check className="h-6 w-6 text-green-500" />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="is-host" className="text-base flex items-center gap-2"><Building /> Is Host</Label>
                            <p className="text-sm text-muted-foreground">Hosts can create and manage listings.</p>
                        </div>
                        <Switch id="is-host" checked={user.isHost} onCheckedChange={handleHostToggle} />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="is-admin" className="text-base flex items-center gap-2"><Shield /> Is Admin</Label>
                            <p className="text-sm text-muted-foreground">Admins have access to this management panel.</p>
                        </div>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Switch id="is-admin" checked={isUserAdmin} />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Admin Status Change</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {isUserAdmin
                                    ? `Are you sure you want to revoke admin privileges for ${user.firstName}? They will immediately lose access to the admin panel.`
                                    : `Are you sure you want to grant admin privileges to ${user.firstName}? They will gain full access to the admin panel.`}
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleAdminToggle(!isUserAdmin)}>
                                    Continue
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
             {/* Placeholder for other management sections */}
        </div>
      </div>
    </div>
  );
}
