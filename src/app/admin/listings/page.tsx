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
import { Loader2, Search, ExternalLink, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

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
          <p className="text-muted-foreground">Moderate property listings across the platform.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>All Listings</CardTitle>
              <CardDescription>A total of {filteredListings?.length || 0} listings matching your criteria.</CardDescription>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search listings..."
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
          ) : !filteredListings || filteredListings.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No listings found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map(listing => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-16 rounded overflow-hidden flex-shrink-0">
                          <Image src={listing.imageUrl} alt="" fill className="object-cover" />
                        </div>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate">{listing.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{listing.location}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{listing.host?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{listing.ownerId.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>₦{listing.pricePerNight?.toLocaleString()}/nt</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge variant="outline">{listing.rating.toFixed(1)} ★</Badge>
                        <Badge variant="outline">{listing.reviewCount} revs</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {listing.createdAt ? format(listing.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => router.push(`/properties/${listing.id}`)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(listing.id)}>
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
