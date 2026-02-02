'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save, FileText, HelpCircle, ShieldCheck, Loader2, History, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Rich text editor dynamic import to prevent hydration issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'quill/dist/quill.snow.css';

const toolbarTooltips: Record<string, string> = {
  '.ql-header': 'Text Heading Level',
  '.ql-bold': 'Bold (Ctrl+B)',
  '.ql-italic': 'Italic (Ctrl+I)',
  '.ql-underline': 'Underline (Ctrl+U)',
  '.ql-strike': 'Strikethrough',
  '.ql-blockquote': 'Blockquote',
  '.ql-list[value="ordered"]': 'Numbered List',
  '.ql-list[value="bullet"]': 'Bullet List',
  '.ql-indent[value="-1"]': 'Decrease Indent',
  '.ql-indent[value="+1"]': 'Increase Indent',
  '.ql-link': 'Insert Link',
  '.ql-image': 'Insert Image (Embedded)',
  '.ql-color': 'Text Color',
  '.ql-background': 'Highlight Color',
  '.ql-clean': 'Clear All Formatting'
};

export default function AdminContentPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  
  const [isSaving, setIsSaving] = React.useState(false);
  const [activePolicy, setActivePolicy] = React.useState('tos');
  const [content, setContent] = React.useState('');

  const policyRef = useMemoFirebase(() => firestore ? doc(firestore, 'content', activePolicy) : null, [firestore, activePolicy]);
  const { data: policy, isLoading } = useDoc(policyRef);

  React.useEffect(() => {
    if (!isLoading) {
      setContent(policy?.text || '');
    }
  }, [policy, isLoading]);

  // Apply tooltips to Quill toolbar
  React.useEffect(() => {
    const timer = setTimeout(() => {
      Object.entries(toolbarTooltips).forEach(([selector, title]) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (!el.getAttribute('title')) {
            el.setAttribute('title', title);
          }
        });
      });
    }, 1000); 
    return () => clearTimeout(timer);
  }, [activePolicy, isLoading]);

  const quillModules = React.useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image', 'color', 'background'],
      ['clean']
    ]
  }), []);

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'indent', 'link', 'image', 'color', 'background'
  ];

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
        title: "Content Published",
        description: `${getPolicyName(activePolicy)} is now live for all users.`,
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
      <style jsx global>{`
        .quill-editor .ql-container {
          min-height: 500px;
          background-color: white !important;
          color: black !important;
          font-size: 16px;
        }
        .quill-editor .ql-editor {
          min-height: 500px;
        }
        .quill-editor .ql-toolbar {
          background-color: #f8fafc !important;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
        .quill-editor .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .quill-editor .ql-editor.ql-blank::before {
          color: rgba(0,0,0,0.6) !important;
        }
      `}</style>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-headline">Content & Policies</h1>
        <p className="text-muted-foreground">Draft and publish formatted legal documents for the platform.</p>
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
                <span>Last Published: {policy?.updatedAt ? policy.updatedAt.toDate().toLocaleDateString() : 'Never'}</span>
            </div>
        </div>

        <Card className="border-2 shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-xl">{getPolicyName(activePolicy)} Editor</CardTitle>
                    <CardDescription>Formatted content is saved directly to Firestore.</CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-md border text-[10px] font-bold text-primary uppercase tracking-widest">
                  <Database className="h-3 w-3" /> Inline Storage Active
                </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-24"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-50" /></div>
            ) : (
              <div className="quill-editor">
                <ReactQuill 
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder={`Start typing the official ${getPolicyName(activePolicy)}...`}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between border-t bg-muted/10 p-6">
            <div className="space-y-1">
                {policy?.lastUpdatedBy && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                        Last updated by {policy.lastUpdatedBy}
                    </div>
                )}
                <p className="text-[10px] text-muted-foreground italic">
                    Images are embedded directly in the document text for high portability.
                </p>
            </div>
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => setContent(policy?.text || '')} disabled={isLoading}>
                    Discard Draft
                </Button>
                <Button onClick={handleSave} disabled={isSaving || isLoading} className="min-w-[140px] bg-primary">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Publish Content
                </Button>
            </div>
          </CardFooter>
        </Card>
      </Tabs>
    </div>
  );
}
