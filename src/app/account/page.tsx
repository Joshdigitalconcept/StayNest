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
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { updatePassword, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
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

const passwordFormSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const deleteFormSchema = z.object({
    password: z.string().min(1, 'Password is required to delete your account.'),
});

export default function AccountPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const deleteForm = useForm<z.infer<typeof deleteFormSchema>>({
      resolver: zodResolver(deleteFormSchema),
      defaultValues: { password: '' },
  });

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    if (!user) return;
    setIsPasswordSubmitting(true);
    try {
      await updatePassword(user, values.newPassword);
      toast({
        title: 'Success!',
        description: 'Your password has been updated.',
      });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'You may need to log in again to change your password. ' + error.message,
      });
    } finally {
      setIsPasswordSubmitting(false);
    }
  }
  
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


  if (isUserLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold font-headline mb-8">Account Settings</h1>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password here. It's a good idea to use a strong password that you're not using elsewhere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <Button type="submit" disabled={isPasswordSubmitting}>
                    {isPasswordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                 </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Delete Account</CardTitle>
            <CardDescription>
              Permanently delete your account and all of your content. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardFooter>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete My Account</Button>
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
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
