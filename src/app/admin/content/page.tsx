
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, FileText, HelpCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function AdminContentPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const [isSaving, setIsSaving] = React.useState(false);
  const [activePolicy, setActivePolicy] = React.useState('tos');

  const policyRef = useMemoFirebase(() => firestore ? doc(firestore, 'content', activePolicy) : null, [firestore, activePolicy]);
  const { data: policy, isLoading } = useDoc(policyRef);

  const [content, setContent] = React.useState('');

  React.useEffect(() => {
    // Only update content when loading finishes to ensure state matches the current tab's document
    if (!isLoading) {
      setContent(policy?.text || '');
    }
  }, [policy, isLoading]);

  const handleSave = async () => {
    if (!policyRef) return;
    setIsSaving(true);
    try {
      await setDoc(policyRef, { 
        text: content, 
        updatedAt: serverTimestamp(),
        lastUpdatedBy: currentUser?.email || 'Admin'
      }, { merge: true });
      
      toast({
        title: "Content Updated",
        description: `${activePolicy.toUpperCase()} changes have been published successfully.`,
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Save Failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const getPolicyName = (id: string) => {
    switch (id) {
      case 'tos': return 'Terms of Service';
      case 'privacy': return 'Privacy Policy';
      case 'help': return 'Help Center';
      default: return 'Document';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content & Policies</h1>
        <p className="text-muted-foreground">Edit official documents, help articles, and platform copy in real-time.</p>
      </div>

      <Tabs value={activePolicy} onValueChange={setActivePolicy} className="space-y-4">
        <TabsList>
          <TabsTrigger value="tos" className="gap-2"><FileText className="h-4 w-4" /> Terms of Service</TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2"><ShieldCheck className="h-4 w-4" /> Privacy Policy</TabsTrigger>
          <TabsTrigger value="help" className="gap-2"><HelpCircle className="h-4 w-4" /> Help Center</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>{getPolicyName(activePolicy)} Editor</CardTitle>
            <CardDescription>Published versions are timestamped and visible to all users via the platform footer.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : (
              <Textarea 
                className="font-mono text-sm leading-relaxed min-h-[400px]" 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Start typing the official ${getPolicyName(activePolicy)} here...`}
              />
            )}
          </CardContent>
          <CardFooter className="justify-between border-t p-6">
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground italic">
                Last saved: {policy?.updatedAt ? policy.updatedAt.toDate().toLocaleString() : 'Never'}
                </p>
                {policy?.lastUpdatedBy && (
                    <p className="text-[10px] text-muted-foreground">Updated by: {policy.lastUpdatedBy}</p>
                )}
            </div>
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Publish Changes
            </Button>
          </CardFooter>
        </Card>
      </Tabs>
    </div>
  );
}
