'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, ArrowLeft, Clock, FileText, ShieldCheck, HelpCircle, Printer } from 'lucide-react';
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
        <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
        <p className="mt-4 text-muted-foreground font-medium text-sm">Loading document...</p>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="container mx-auto py-24 px-4 text-center">
        <div className="max-w-md mx-auto space-y-6">
            <div className="bg-muted rounded-full h-20 w-20 flex items-center justify-center mx-auto">
                <FileText className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
            <h1 className="text-3xl font-bold font-headline">Document Not Found</h1>
            <p className="text-muted-foreground">The document you're looking for might have been moved or is currently being updated.</p>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">Return Home</Button>
        </div>
      </div>
    );
  }

  const Icon = policyIcons[id] || FileText;
  const title = policyTitles[id] || 'Platform Document';

  return (
    <div className="min-h-screen bg-background">
        <div className="container mx-auto py-12 max-w-3xl px-4 md:px-6">
            <div className="flex items-center justify-between mb-10">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden md:flex gap-2">
                    <Printer className="h-4 w-4" /> Print
                </Button>
            </div>

            <article className="space-y-8">
                <header className="space-y-4">
                    <div className="flex items-center gap-3 text-primary">
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-bold uppercase tracking-widest">StayNest Official</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">{title}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Last Updated: {policy.updatedAt ? format(policy.updatedAt.toDate(), 'MMMM d, yyyy') : 'Recently'}</span>
                    </div>
                </header>

                <Separator className="my-8" />

                <div className="prose prose-slate dark:prose-invert prose-headings:font-headline prose-headings:font-bold prose-a:text-primary max-w-none break-words">
                    <div 
                      dangerouslySetInnerHTML={{ __html: policy.text || "<p>This document is currently being drafted.</p>" }} 
                    />
                </div>
                
                <Separator className="my-12" />
                
                <footer className="pt-8 pb-16 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                        &copy; {new Date().getFullYear()} StayNest Nigeria &middot; Secure & Trusted
                    </p>
                </footer>
            </article>
        </div>
    </div>
  );
}
