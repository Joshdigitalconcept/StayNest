
'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
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
import { Loader2, Landmark, Wallet, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function AdminPayoutsPage() {
  const firestore = useFirestore();

  // Fetch confirmed bookings as they represent scheduled payouts
  const payoutsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'bookings'), where('status', '==', 'confirmed'), orderBy('createdAt', 'desc')) : null,
    [firestore]
  );
  const { data: payouts, isLoading } = useCollection<Booking>(payoutsQuery);

  const stats = React.useMemo(() => {
    if (!payouts) return { hostPayouts: 0, fees: 0 };
    const gross = payouts.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
    // Platform fee logic: assume 15% service fee included in total
    const fees = gross * 0.15;
    const hostPayouts = gross - fees;
    return { hostPayouts, fees };
  }, [payouts]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Host Payouts & Revenue</h1>
          <p className="text-muted-foreground">Manage distributor settlements and platform commissions.</p>
        </div>
        <Button>
          <Landmark className="mr-2 h-4 w-4" /> Batch Settlements
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-80">Platform Net Revenue</CardTitle>
              <ArrowUpRight className="h-5 w-5 opacity-50" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">₦{stats.fees.toLocaleString()}</div>
            <p className="text-xs mt-2 opacity-70">Calculated from 15% average platform service fee</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Total Host Earnings</CardTitle>
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">₦{stats.hostPayouts.toLocaleString()}</div>
            <p className="text-xs mt-2 text-muted-foreground">Funds scheduled for disbursement</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disbursement Schedule</CardTitle>
          <CardDescription>Upcoming and completed payouts to listing owners.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
          ) : !payouts || payouts.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No payouts scheduled.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host Name</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Payout Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map(payout => {
                  const amount = (payout.totalPrice || 0) * 0.85;
                  return (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{payout.host?.name || 'Host'}</p>
                        <p className="text-[10px] text-muted-foreground">ID: {payout.hostId.slice(0, 8)}</p>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {payout.listing?.title}
                      </TableCell>
                      <TableCell className="font-bold text-sm">₦{amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px]">
                          Scheduled
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(payout.checkOutDate.toDate(), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
