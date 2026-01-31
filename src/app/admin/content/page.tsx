
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
import { Save, FileText, HelpCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminContentPage() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Content Updated",
      description: "Policy changes have been published to the live site.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content & Policies</h1>
        <p className="text-muted-foreground">Edit official documents, help articles, and platform copy.</p>
      </div>

      <Tabs defaultValue="tos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tos" className="gap-2"><FileText className="h-4 w-4" /> Terms of Service</TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2"><ShieldCheck className="h-4 w-4" /> Privacy Policy</TabsTrigger>
          <TabsTrigger value="help" className="gap-2"><HelpCircle className="h-4 w-4" /> Help Center</TabsTrigger>
        </TabsList>

        <TabsContent value="tos">
          <Card>
            <CardHeader>
              <CardTitle>Terms of Service Editor</CardTitle>
              <CardDescription>Updated versions will be timestamped and required for user re-acceptance.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                className="font-mono text-sm leading-relaxed" 
                rows={20} 
                defaultValue={`STAYNEST TERMS OF SERVICE\n\nLast Updated: January 2024\n\n1. ACCEPTANCE OF TERMS\nWelcome to StayNest. By using our platform, you agree to comply with these terms...\n\n2. USER ELIGIBILITY\nYou must be at least 18 years old to create an account...\n\n3. LISTING REQUIREMENTS\nHosts must provide accurate descriptions and real photos of their properties...`}
              />
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Publish Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
              <CardDescription>Describe how you collect and handle user data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                className="font-mono text-sm leading-relaxed" 
                rows={20} 
                defaultValue={`PRIVACY POLICY\n\nAt StayNest, your privacy is our priority. This policy outlines our data collection practices...\n\nDATA WE COLLECT:\n- Personal Identity Info\n- Financial Transaction Data\n- Usage Logs and Cookies...`}
              />
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Publish Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
