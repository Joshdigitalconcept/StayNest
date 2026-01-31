
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Send, Bell, Mail, Smartphone, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSending, setIsSending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;
    
    setIsSending(true);
    const formData = new FormData(e.currentTarget);
    
    const notificationData = {
      title: formData.get('title'),
      content: formData.get('content'),
      target: formData.get('target'),
      createdAt: serverTimestamp(),
      type: 'broadcast',
      channels: ['in-app']
    };

    try {
      await addDoc(collection(firestore, 'notifications'), notificationData);
      toast({
        title: "Broadcast Dispatched",
        description: "The notification has been recorded and will be delivered to active sessions.",
      });
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Dispatch Failed", description: error.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Notifications & Broadcasts</h1>
        <p className="text-muted-foreground">Send system-wide messages and manage platform communication templates.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Broadcast Message</CardTitle>
          <CardDescription>Choose your audience and deliver a live platform-wide alert.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <RadioGroup name="target" defaultValue="all" className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal">All Users</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hosts" id="hosts" />
                  <Label htmlFor="hosts" className="font-normal">Hosts Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="guests" id="guests" />
                  <Label htmlFor="guests" className="font-normal">Guests Only</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Message Title</Label>
              <Input name="title" id="title" placeholder="Platform Maintenance Update" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Message Content</Label>
              <Textarea name="content" id="content" placeholder="Type your broadcast message here..." rows={5} required />
            </div>

            <div className="space-y-2">
              <Label>Delivery Channels</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 border p-3 rounded-md flex-1 border-primary bg-primary/5">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">In-App Live</span>
                </div>
                <div className="flex items-center gap-2 border p-3 rounded-md flex-1 opacity-50 cursor-not-allowed">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <div className="flex items-center gap-2 border p-3 rounded-md flex-1 opacity-50 cursor-not-allowed">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-sm font-medium">Push</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSending}>
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Dispatch Broadcast
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
