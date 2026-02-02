'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, ArrowLeft, Clock, FileText, ShieldCheck, HelpCircle, Share2, Printer } from 'lucide-react';
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
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        <p className="mt-4 text-muted-foreground animate-pulse font-medium">Fetching document...</p>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="container mx-auto py-24 px-4 text-center">
        <div className="max-w-md mx-auto space-y-6">
            <div className="bg-muted rounded-full h-24 w-24 flex items-center justify-center mx-auto">
                <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
            </div>
            <h1 className="text-4xl font-bold font-headline">Document Not Found</h1>
            <p className="text-muted-foreground">The document you're looking for might have been moved or is currently being updated by the administration.</p>
            <Button onClick={() => router.push('/')} variant="default" className="w-full">Return Home</Button>
        </div>
      </div>
    );
  }

  const Icon = policyIcons[id] || FileText;
  const title = policyTitles[id] || 'Platform Document';

  return (
    <div className="bg-muted/10 min-h-screen">
        <div className="container mx-auto py-12 max-w-4xl px-4 md:px-6">
            <div className="flex items-center justify-between mb-12">
                <Button variant="ghost" onClick={() => router.back()} className="-ml-4 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden md:flex">
                        <Printer className="mr-2 h-4 w-4" /> Print Copy
                    </Button>
                </div>
            </div>

            <div className="bg-background border shadow-2xl rounded-2xl overflow-hidden print:border-none print:shadow-none">
                <div className="bg-primary/5 p-8 md:p-12 border-b">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="bg-primary p-4 rounded-2xl text-primary-foreground shadow-lg shrink-0">
                            <Icon className="h-10 w-10" />
                        </div>
                        <div className="text-center md:text-left space-y-2">
                            <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tight">{title}</h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    Last Updated: {policy.updatedAt ? format(policy.updatedAt.toDate(), 'MMMM d, yyyy') : 'N/A'}
                                </span>
                                <span>&middot;</span>
                                <span className="text-primary">StayNest Nigeria Official</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-12">
                    <div className="max-w-none prose dark:prose-invert prose-slate prose-lg md:prose-xl prose-headings:font-headline prose-headings:font-black prose-a:text-primary prose-strong:text-foreground">
                        <div 
                          dangerouslySetInnerHTML={{ __html: policy.text || "<p>This document is currently being drafted.</p>" }} 
                        />
                    </div>
                    
                    <Separator className="my-12" />
                    
                    <div className="bg-muted/30 p-6 rounded-xl border border-dashed text-center">
                        <p className="text-sm text-muted-foreground italic">
                            This is an official document of the StayNest platform. If you have questions regarding these terms, please contact our support team.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="mt-12 text-center text-xs text-muted-foreground font-medium uppercase tracking-widest">
                &copy; {new Date().getFullYear()} StayNest Nigeria &middot; Protected and Secured
            </div>
        </div>
    </div>
  );
}
