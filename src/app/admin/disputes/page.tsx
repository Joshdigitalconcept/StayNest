
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, MessageSquare, Clock, Filter, Loader2, Plus } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function AdminDisputesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const ticketsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'tickets'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: tickets, isLoading } = useCollection(ticketsQuery);

  const stats = React.useMemo(() => {
    if (!tickets) return { urgent: 0, open: 0 };
    return {
      urgent: tickets.filter(t => t.priority === 'high' && t.status !== 'closed').length,
      open: tickets.filter(t => t.status !== 'closed').length
    };
  }, [tickets]);

  const handleCreateTestTicket = async () => {
    if (!firestore) return;
    try {
      await addDoc(collection(firestore, 'tickets'), {
        subject: 'New Dispute: Property Damage Claim',
        user: 'Auto Generated',
        status: 'open',
        priority: 'high',
        createdAt: serverTimestamp(),
      });
      toast({ title: "Test Ticket Created" });
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Disputes & Support</h1>
          <p className="text-muted-foreground">Manage support tickets and resolve conflicts between users in real-time.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateTestTicket}>
            <Plus className="mr-2 h-4 w-4" /> New Mock Ticket
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-600">Urgent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.urgent}</div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Inquiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.open}</div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">94%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Support Queue</CardTitle>
          <CardDescription>Live stream of incoming reports and support requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : !tickets || tickets.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No active tickets found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requester</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-bold text-sm">{t.user || 'Guest'}</TableCell>
                    <TableCell className="text-sm">{t.subject}</TableCell>
                    <TableCell>
                      <Badge variant={t.priority === 'high' ? 'destructive' : t.priority === 'medium' ? 'secondary' : 'outline'} className="text-[10px] uppercase">
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className={`h-2 w-2 rounded-full ${t.status === 'open' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                        {t.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t.createdAt ? format(t.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">Resolve</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
