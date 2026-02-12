
'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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
import { Input } from '@/components/ui/input';
import { Loader2, Search, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function AdminBookingsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = React.useState('');

  const bookingsQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, 'bookings'), orderBy('createdAt', 'desc')) : null,
    [firestore, user]
  );
  const { data: bookings, isLoading } = useCollection<Booking>(bookingsQuery);

  const filteredBookings = React.useMemo(() => {
    if (!bookings) return null;
    if (!searchTerm) return bookings;
    const term = searchTerm.toLowerCase();
    return bookings.filter(b => 
      b.listing?.title?.toLowerCase().includes(term) || 
      b.guest?.name?.toLowerCase().includes(term) ||
      b.host?.name?.toLowerCase().includes(term)
    );
  }, [bookings, searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>;
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'declined': return <Badge variant="destructive">Declined</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bookings Management</h1>
        <p className="text-muted-foreground">Monitor all reservations and transactions.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>View reservation details and current status.</CardDescription>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                className="pl-8 w-full md:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
          ) : !filteredBookings || filteredBookings.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No bookings found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map(booking => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      <p className="truncate max-w-[200px]">{booking.listing?.title || 'Unknown Listing'}</p>
                      <p className="text-xs text-muted-foreground">{booking.listing?.location}</p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{booking.guest?.name || 'Guest'}</p>
                        <p className="text-xs text-muted-foreground">Host: {booking.host?.name || 'Host'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{format(booking.checkInDate.toDate(), 'MMM d')} - {format(booking.checkOutDate.toDate(), 'MMM d, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">₦{booking.totalPrice?.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell className="text-sm">
                      {booking.createdAt ? format(booking.createdAt.toDate(), 'MMM d') : 'N/A'}
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
