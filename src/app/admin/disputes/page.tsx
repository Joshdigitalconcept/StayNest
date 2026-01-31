
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
import { ShieldAlert, MessageSquare, Clock, Filter } from 'lucide-react';

export default function AdminDisputesPage() {
  const tickets = [
    { id: 'TKT-102', user: 'Chidi O.', subject: 'Unclean Property', status: 'Open', priority: 'High', date: '2h ago' },
    { id: 'TKT-105', user: 'Amina B.', subject: 'Booking Conflict', status: 'Pending', priority: 'Medium', date: '5h ago' },
    { id: 'TKT-108', user: 'John D.', subject: 'Refund Request', status: 'Closed', priority: 'Low', date: '1d ago' },
    { id: 'TKT-110', user: 'Tunde S.', subject: 'Key Exchange Issue', status: 'Open', priority: 'High', date: '3h ago' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Disputes & Support</h1>
          <p className="text-muted-foreground">Manage support tickets and resolve conflicts between users.</p>
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Filter Tickets
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-600">Urgent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Average Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45m</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Support Queue</CardTitle>
          <CardDescription>Open inquiries requiring administrator intervention.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-bold text-xs">{t.id}</TableCell>
                  <TableCell className="text-sm font-medium">{t.user}</TableCell>
                  <TableCell className="text-sm">{t.subject}</TableCell>
                  <TableCell>
                    <Badge variant={t.priority === 'High' ? 'destructive' : t.priority === 'Medium' ? 'secondary' : 'outline'} className="text-[10px]">
                      {t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className={`h-2 w-2 rounded-full ${t.status === 'Open' ? 'bg-green-500' : 'bg-amber-500'}`} />
                      {t.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">View Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
