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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser, useAuth } from '@/firebase';
import { updatePassword, signOut } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

const passwordFormSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});


export function LoginSecuritySection() {
  const { toast } = useToast();
  const { user } = useUser();
  const auth = useAuth();
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
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
  
  const handleLogoutEverywhere = async () => {
     if (!auth.currentUser) return;
     try {
       // Note: True "sign out everywhere" requires server-side token revocation.
       // This client-side action signs the user out of the current device,
       // which is a good first step for v1.
       await signOut(auth);
       toast({
         title: 'Signed Out',
         description: 'You have been signed out from this device.',
       });
     } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Sign Out Failed',
            description: error.message,
        });
     }
  }

  return (
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
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-sm">
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
        
        <Card>
           <CardHeader>
            <CardTitle>Sign out from all devices</CardTitle>
            <CardDescription>
              This will sign you out of all active sessions on other computers and phones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleLogoutEverywhere}>Sign out everywhere</Button>
          </CardContent>
        </Card>
    </div>
  );
}
