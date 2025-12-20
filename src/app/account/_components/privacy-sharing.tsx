'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

const deleteFormSchema = z.object({
    password: z.string().min(1, 'Password is required to delete your account.'),
});

export function PrivacySharingSection() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const deleteForm = useForm<z.infer<typeof deleteFormSchema>>({
      resolver: zodResolver(deleteFormSchema),
      defaultValues: { password: '' },
  });

  async function onDeleteSubmit() {
    if (!user || !user.email) return;

    setIsDeleteSubmitting(true);
    const password = deleteForm.getValues('password');
    const credential = EmailAuthProvider.credential(user.email, password);
    
    try {
      await reauthenticateWithCredential(user, credential);
      await deleteUser(user);
      toast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted.",
      });
      router.push('/');
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: 'Incorrect password or another error occurred. ' + error.message,
      });
    } finally {
        setIsDeleteSubmitting(false);
    }
  }

  return (
     <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Delete Account</CardTitle>
            <CardDescription>
              Permanently delete your account and all of your content. This action is not reversible and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">Request account deletion</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete your account, your profile, and all associated listings and bookings. This action cannot be undone. To confirm, please enter your password.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                     <Form {...deleteForm}>
                        <form id="delete-account-form" onSubmit={deleteForm.handleSubmit(onDeleteSubmit)} className="space-y-4 pt-4">
                           <FormField
                            control={deleteForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </form>
                    </Form>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleteSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction form="delete-account-form" type="submit" disabled={isDeleteSubmitting}>
                         {isDeleteSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         Delete Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
  );
}
