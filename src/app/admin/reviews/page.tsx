'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, doc, deleteDoc, collection } from 'firebase/firestore';
import type { Review, Property } from '@/lib/types';
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
import { Loader2, Trash2, Star, Search, ExternalLink, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function AdminReviewsPage() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const listingIdParam = searchParams.get('listingId');
  const [searchTerm, setSearchTerm] = React.useState('');

  // 1. Fetch reviews
  const reviewsQuery = useMemoFirebase(
    () => firestore ? query(collectionGroup(firestore, 'reviews'), orderBy('createdAt', 'desc')) : null,
    [firestore]
  );
  const { data: reviews, isLoading: isReviewsLoading } = useCollection<Review>(reviewsQuery);

  // 2. Fetch listings to get titles
  const listingsQuery = useMemoFirebase(
    () => firestore ? collection(firestore, 'listings') : null,
    [firestore]
  );
  const { data: listings, isLoading: isListingsLoading } = useCollection<Property>(listingsQuery);

  const listingsMap = React.useMemo(() => {
    const map = new Map<string, Property>();
    listings?.forEach(l => map.set(l.id, l));
    return map;
  }, [listings]);

  const filteredReviews = React.useMemo(() => {
    if (!reviews) return null;
    
    let result = reviews;

    // Filter by specific listing if provided in URL
    if (listingIdParam) {
      result = result.filter(r => r.listingId === listingIdParam);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => {
        const listing = listingsMap.get(r.listingId);
        return (
          r.user?.name?.toLowerCase().includes(term) ||
          r.comment?.toLowerCase().includes(term) ||
          listing?.title?.toLowerCase().includes(term)
        );
      });
    }

    return result;
  }, [reviews, searchTerm, listingsMap, listingIdParam]);

  const handleDelete = async (review: Review) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const reviewRef = doc(firestore, 'listings', review.listingId, 'reviews', review.id);
      await deleteDoc(reviewRef);
      toast({ title: 'Review Deleted', description: 'The review has been removed.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const isLoading = isReviewsLoading || isListingsLoading;
  const activeListingFilter = listingIdParam ? listingsMap.get(listingIdParam) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Reviews Moderation</h1>
        <p className="text-muted-foreground">Manage and moderate user-submitted reviews across the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <CardTitle>
                {activeListingFilter ? (
                  <div className="flex items-center gap-2">
                    <span>Reviews for "{activeListingFilter.title}"</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" asChild>
                      <Link href="/admin/reviews"><X className="h-3 w-3" /></Link>
                    </Button>
                  </div>
                ) : (
                  "All Platform Reviews"
                )}
              </CardTitle>
              <CardDescription>
                {filteredReviews ? `${filteredReviews.length} feedback entries matching your filters.` : 'Loading records...'}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user, comment, or property..."
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
          ) : !filteredReviews || filteredReviews.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Star className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No reviews found matching your criteria.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing Context</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map(review => {
                  const listing = listingsMap.get(review.listingId);
                  return (
                    <TableRow key={review.id}>
                      <TableCell className="max-w-[200px]">
                        {listing ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-sm truncate">{listing.title}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{listing.location}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] opacity-50">Inactive Listing</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={review.user?.photoURL || ''} />
                            <AvatarFallback className="text-[10px]">{review.user?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold">{review.user?.name || 'Anonymous'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-black text-sm">{review.rating}</span>
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs max-w-[300px] line-clamp-2 italic text-muted-foreground">"{review.comment}"</p>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {review.createdAt ? format(review.createdAt.toDate(), 'MMM d, yyyy') : 'Recently'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                           {listing && (
                             <Button size="icon" variant="ghost" asChild className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                               <Link href={`/properties/${listing.id}`} target="_blank">
                                 <ExternalLink className="h-3.5 w-3.5" />
                               </Link>
                             </Button>
                           )}
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(review)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
