
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
import { Save, FileText, HelpCircle, ShieldCheck, Loader2, History } from 'lucide-react';
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
        description: `${getPolicyName(activePolicy)} has been published successfully.`,
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
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-headline">Content & Policies</h1>
        <p className="text-muted-foreground">Manage the legal framework and help documentation of the platform.</p>
      </div>

      <Tabs value={activePolicy} onValueChange={setActivePolicy} className="space-y-4">
        <div className="flex items-center justify-between">
            <TabsList>
                <TabsTrigger value="tos" className="gap-2"><FileText className="h-4 w-4" /> TOS</TabsTrigger>
                <TabsTrigger value="privacy" className="gap-2"><ShieldCheck className="h-4 w-4" /> Privacy</TabsTrigger>
                <TabsTrigger value="help" className="gap-2"><HelpCircle className="h-4 w-4" /> Help Center</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
                <History className="h-3 w-3" />
                <span>Last Published: {policy?.updatedAt ? policy.updatedAt.toDate().toLocaleDateString() : 'None'}</span>
            </div>
        </div>

        <Card className="border-2">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-xl">{getPolicyName(activePolicy)} Editor</CardTitle>
                    <CardDescription>All changes are immediately live to users via the platform footer links.</CardDescription>
                </div>
                <div className="bg-background px-3 py-1 rounded-md border text-xs font-bold text-primary uppercase tracking-widest">Drafting Mode</div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-24"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-50" /></div>
            ) : (
              <Textarea 
                className="font-mono text-sm leading-relaxed min-h-[500px] border-none focus-visible:ring-0 shadow-none resize-none p-0" 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Start typing the official ${getPolicyName(activePolicy)}... Use clear headings and sections for better readability.`}
              />
            )}
          </CardContent>
          <CardFooter className="justify-between border-t bg-muted/10 p-6">
            <div className="space-y-1">
                {policy?.lastUpdatedBy && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                        Updated by {policy.lastUpdatedBy}
                    </div>
                )}
                <p className="text-[10px] text-muted-foreground italic">
                    Internal Document ID: content/{activePolicy}
                </p>
            </div>
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => setContent(policy?.text || '')} disabled={isLoading}>
                    Reset
                </Button>
                <Button onClick={handleSave} disabled={isSaving || isLoading} className="min-w-[140px]">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Publish Changes
                </Button>
            </div>
          </CardFooter>
        </Card>
      </Tabs>
    </div>
  );
}
