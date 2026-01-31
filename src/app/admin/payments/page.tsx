
'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Booking } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function AdminPaymentsPage() {
  const firestore = useFirestore();

  const bookingsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'bookings'), orderBy('createdAt', 'desc'), limit(50)) : null,
    [firestore]
  );
  const { data: bookings, isLoading } = useCollection<Booking>(bookingsQuery);

  const stats = React.useMemo(() => {
    if (!bookings) return { total: 0, pending: 0 };
    const total = bookings.filter(b => b.status === 'confirmed').reduce((acc, b) => acc + (b.totalPrice || 0), 0);
    const pending = bookings.filter(b => b.status === 'pending').reduce((acc, b) => acc + (b.totalPrice || 0), 0);
    return { total, pending };
  }, [bookings]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Payments & Transactions</h1>
          <p className="text-muted-foreground">Monitor financial flow and transaction status.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground font-medium">Total Platform Volume</p>
          <p className="text-2xl font-black text-primary">₦{stats.total.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-green-600">Settled Funds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">₦{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Authorization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">₦{stats.pending.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">₦0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Comprehensive log of all payment attempts.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
          ) : !bookings || bookings.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No transactions recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map(booking => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">{booking.id.slice(0, 12)}...</TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{booking.guest?.name || 'User'}</p>
                      <p className="text-[10px] text-muted-foreground">Guest ID: {booking.guestId.slice(0, 8)}</p>
                    </TableCell>
                    <TableCell className="font-bold text-sm">₦{booking.totalPrice?.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <CreditCard className="h-3 w-3" />
                        Card
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px] uppercase">
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {booking.createdAt ? format(booking.createdAt.toDate(), 'MMM d, h:mm a') : 'N/A'}
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
