
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Star } from 'lucide-react';
import type { Property } from '@/lib/types';

function InvalidBookingState() {
  const params = useParams();
  const id = params.id as string;
  return (
    <div className="container mx-auto py-12 max-w-lg text-center">
       <Card>
          <CardHeader>
             <CardTitle>Incomplete Booking Details</CardTitle>
             <CardDescription>
                We couldn't get all the details for this reservation. Please go back and select your dates and guest count again.
             </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/properties/${id}`}>Return to Listing</Link>
            </Button>
          </CardContent>
       </Card>
    </div>
  )
}

export default function BookPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // --- Data Fetching ---
  const propertyRef = useMemoFirebase(
    () => (firestore && id) ? doc(firestore, 'listings', id) : null,
    [firestore, id]
  );
  const { data: property, isLoading } = useDoc<Property>(propertyRef);
  
  // --- URL Params ---
  const checkinStr = searchParams.get('checkin');
  const checkoutStr = searchParams.get('checkout');
  const guestsStr = searchParams.get('guests');

  // --- Derived State ---
  const { checkinDate, checkoutDate, duration, subtotal, totalPrice, isValidBooking } = React.useMemo(() => {
    if (!checkinStr || !checkoutStr || !guestsStr || !property) {
      return { isValidBooking: false, duration: 0, subtotal: 0, totalPrice: 0, checkinDate: null, checkoutDate: null };
    }
    
    const cIn = parseISO(checkinStr);
    const cOut = parseISO(checkoutStr);

    if (!isValid(cIn) || !isValid(cOut) || !guestsStr) {
      return { isValidBooking: false, duration: 0, subtotal: 0, totalPrice: 0, checkinDate: null, checkoutDate: null };
    }

    const dur = differenceInCalendarDays(cOut, cIn);
    if (dur <= 0) {
      return { isValidBooking: false, duration: 0, subtotal: 0, totalPrice: 0, checkinDate: cIn, checkoutDate: cOut };
    }

    const price = property.pricePerNight || 0;
    const cleaning = property.cleaningFee || 0;
    const service = property.serviceFee || 0;

    const sub = price * dur;
    const total = sub + cleaning + service;
    
    return { isValidBooking: true, checkinDate: cIn, checkoutDate: cOut, duration: dur, subtotal: sub, totalPrice: total };
  }, [checkinStr, checkoutStr, guestsStr, property]);

  // --- Event Handlers ---
  const handleConfirmAndBook = async () => {
    if (!user || !property || !checkinDate || !checkoutDate || !guestsStr) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Cannot complete booking.' });
      return;
    }
    setIsSubmitting(true);
    
    const bookingStatus = property.bookingSettings === 'instant' ? 'confirmed' : 'pending';

    const bookingData = {
      guestId: user.uid,
      hostId: property.ownerId,
      listingId: property.id,
      checkInDate: Timestamp.fromDate(checkinDate),
      checkOutDate: Timestamp.fromDate(checkoutDate),
      guests: parseInt(guestsStr, 10),
      totalPrice,
      status: bookingStatus,
      createdAt: serverTimestamp(),
      listing: { id: property.id, title: property.title, location: property.location, imageUrl: property.imageUrl },
      guest: { name: user.displayName || user.email, photoURL: user.photoURL },
      host: { name: property.host?.name ?? null, photoURL: property.host?.photoURL ?? null },
    };

    const bookingsColRef = collection(firestore, 'bookings');
    
    try {
      await addDoc(bookingsColRef, bookingData);
      toast({
        title: 'Reservation Submitted!',
        description: bookingStatus === 'confirmed'
          ? 'Your booking is confirmed. Enjoy your trip!'
          : 'Your request has been sent to the host for approval.',
      });
      router.push('/profile?tab=bookings');
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: bookingsColRef.path,
        operation: 'create',
        requestResourceData: bookingData,
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: 'destructive', title: 'Booking Failed', description: 'Could not submit your reservation. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- Loading & Error States ---
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }
  if (!property || !isValidBooking) {
    return <InvalidBookingState />;
  }

  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Review Your Reservation</CardTitle>
          <CardDescription>Confirm the details of your trip before booking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="flex flex-col md:flex-row gap-6 border-b pb-6">
            <div className="relative w-full md:w-1/3 aspect-video rounded-lg overflow-hidden">
              <Image src={property.imageUrl} alt={property.title} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Entire place hosted by {property.host?.name || 'the host'}</p>
              <h2 className="text-xl font-semibold mt-1">{property.title}</h2>
              <div className="flex items-center gap-1 text-sm mt-1">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{property.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({property.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your trip</h3>
            <div className="flex justify-between">
              <span className="font-medium">Dates</span>
              <span>{checkinDate ? format(checkinDate, 'MMM d') : ''} - {checkoutDate ? format(checkoutDate, 'd, yyyy') : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Guests</span>
              <span>{guestsStr} guest{parseInt(guestsStr || '1', 10) > 1 ? 's' : ''}</span>
            </div>
             <Button variant="link" className="p-0 h-auto" asChild>
                <Link href={`/properties/${id}`}>Edit details</Link>
             </Button>
          </div>

          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Price details</h3>
            <div className="flex justify-between text-muted-foreground">
              <span>${(property.pricePerNight || 0).toFixed(2)} x {duration} nights</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Cleaning fee</span>
              <span>${(property.cleaningFee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>StayNest service fee</span>
              <span>${(property.serviceFee || 0).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total (USD)</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <Button 
            className="w-full bg-pink-600 hover:bg-pink-700 text-white" 
            size="lg"
            onClick={handleConfirmAndBook}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm and Book'}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
