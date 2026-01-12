
'use client';

import * as React from 'react';
import { useUser, useAuth } from '@/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { AlertCircle, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

export function EmailVerificationBanner() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const [isSending, setIsSending] = React.useState(false);

  const handleResendVerification = async () => {
    if (!user) return;
    setIsSending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: 'Verification Email Sent',
        description: 'A new verification link has been sent to your email address.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Sending Email',
        description: error.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  // Don't show the banner if:
  // 1. The user state is still loading.
  // 2. There is no user logged in.
  // 3. The user's email has been verified.
  // 4. The user signed in with a provider other than email/password (e.g., Google).
  if (isUserLoading || !user || user.emailVerified || user.providerData.some(p => p.providerId !== 'password')) {
    return null;
  }

  return (
    <div className="w-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 p-3 text-sm">
      <div className="container mx-auto flex items-center justify-center gap-4">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <span className="font-medium">
          Please verify your email address. Check your inbox for a verification link.
        </span>
        <Button
          variant="link"
          className="text-amber-800 dark:text-amber-200 h-auto p-0 underline"
          onClick={handleResendVerification}
          disabled={isSending}
        >
          {isSending ? 'Sending...' : 'Resend Email'}
        </Button>
      </div>
    </div>
  );
}
