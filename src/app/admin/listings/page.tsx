'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import type { Property } from '@/lib/types';
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
import { Loader2, Search, ExternalLink, Trash2, MessageSquareText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminListingsPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');

  const listingsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'listings'), orderBy('createdAt', 'desc')) : null,
    [firestore]
  );
  const { data: listings, isLoading } = useCollection<Property>(listingsQuery);

  const filteredListings = React.useMemo(() => {
    if (!listings) return null;
    if (!searchTerm) return listings;
    const term = searchTerm.toLowerCase();
    return listings.filter(l => 
      l.title.toLowerCase().includes(term) || 
      l.location.toLowerCase().includes(term) ||
      l.host?.name?.toLowerCase().includes(term)
    );
  }, [listings, searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(firestore, 'listings', id));
      toast({ title: 'Listing Deleted', description: 'The property has been removed.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Listings Management</h1>
          <p className="text-muted-foreground">Moderate and monitor all property listings live on the platform.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Inventory Overview</CardTitle>
              <CardDescription>A total of {filteredListings?.length || 0} active properties.</CardDescription>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by title, host, or location..."
                className="pl-8 w-full md:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : !filteredListings || filteredListings.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No listings found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Host Details</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Listed On</TableHead>
                  <TableHead className="text-right">Administration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map(listing => (
                  <TableRow key={listing.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-14 rounded overflow-hidden flex-shrink-0 bg-muted border">
                          {listing.imageUrl ? (
                            <Image src={listing.imageUrl} alt="" fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">NO IMG</div>
                          )}
                        </div>
                        <div className="max-w-[180px]">
                          <p className="font-bold text-sm truncate">{listing.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter font-semibold">{listing.location}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="font-semibold">{listing.host?.name || 'Unknown Host'}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{listing.ownerId.slice(0, 8)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-bold text-primary">₦{listing.pricePerNight?.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">per night</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                          <span className="font-bold text-xs text-amber-700">{listing.rating.toFixed(1)}</span>
                          <span className="text-[10px] text-amber-600 opacity-70">★</span>
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">{listing.reviewCount} revs</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {listing.createdAt ? format(listing.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" asChild className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600" title="Manage Reviews">
                          <Link href={`/admin/reviews?listingId=${listing.id}`}>
                            <MessageSquareText className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => router.push(`/properties/${listing.id}`)} className="h-8 w-8" title="View Public Page">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(listing.id)} title="Delete Listing">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
