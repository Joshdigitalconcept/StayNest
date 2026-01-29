'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import type { Review } from '@/lib/types';
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
import { Loader2, Trash2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminReviewsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  // Use collectionGroup to find all reviews across all listings
  const reviewsQuery = useMemoFirebase(
    () => firestore ? query(collectionGroup(firestore, 'reviews'), orderBy('createdAt', 'desc')) : null,
    [firestore]
  );
  const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);

  const handleDelete = async (review: Review) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      // Review path is listings/{listingId}/reviews/{reviewId}
      const reviewRef = doc(firestore, 'listings', review.listingId, 'reviews', review.id);
      await deleteDoc(reviewRef);
      toast({ title: 'Review Deleted', description: 'The review has been removed.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews Moderation</h1>
        <p className="text-muted-foreground">Manage and moderate user-submitted reviews.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
          <CardDescription>A centralized view of all feedback across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
          ) : !reviews || reviews.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No reviews found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map(review => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.user?.photoURL || ''} />
                          <AvatarFallback>{review.user?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <p className="font-medium">{review.user?.name || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[100px]">ID: {review.listingId.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{review.rating}</span>
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm max-w-[400px] line-clamp-2 italic">"{review.comment}"</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {review.createdAt ? format(review.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(review)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
