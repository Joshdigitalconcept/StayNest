
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, ArrowLeft, Clock, FileText, ShieldCheck, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

const policyIcons: Record<string, any> = {
  tos: FileText,
  privacy: ShieldCheck,
  help: HelpCircle,
};

const policyTitles: Record<string, string> = {
  tos: 'Terms of Service',
  privacy: 'Privacy Policy',
  help: 'Help Center & FAQs',
};

export default function PolicyPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const firestore = useFirestore();

  const policyRef = useMemoFirebase(
    () => firestore ? doc(firestore, 'content', id) : null,
    [firestore, id]
  );
  const { data: policy, isLoading } = useDoc(policyRef);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="container mx-auto py-24 text-center">
        <h1 className="text-4xl font-bold mb-4">Document Not Found</h1>
        <p className="text-muted-foreground mb-8">The requested policy document does not exist.</p>
        <Button onClick={() => router.push('/')}>Return Home</Button>
      </div>
    );
  }

  const Icon = policyIcons[id] || FileText;
  const title = policyTitles[id] || 'Platform Document';

  return (
    <div className="container mx-auto py-12 max-w-4xl px-4">
      <Button variant="ghost" onClick={() => router.back()} className="mb-8 -ml-4 text-muted-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-xl text-primary">
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline">{title}</h1>
            {policy.updatedAt && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <Clock className="h-3 w-3" />
                Last updated: {format(policy.updatedAt.toDate(), 'PPP')}
              </p>
            )}
          </div>
        </div>

        <Separator className="my-8" />

        <div className="prose prose-slate max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap leading-relaxed text-lg text-foreground/80">
            {policy.text || "This document is currently being updated. Please check back later."}
          </div>
        </div>
      </div>
    </div>
  );
}
