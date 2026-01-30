
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError, useCollection } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { differenceInCalendarDays, format, isValid, parseISO, areIntervalsOverlapping } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Star, CreditCard, ChevronRight, Check } from 'lucide-react';
import type { Property, User as UserType, Booking } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
  const [paymentMethod, setPaymentMethod] = React.useState('card_1');

  // --- Data Fetching ---
  const propertyRef = useMemoFirebase(
    () => (firestore && id) ? doc(firestore, 'listings', id) : null,
    [firestore, id]
  );
  const { data: property, isLoading } = useDoc<Property>(propertyRef);

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc<UserType>(userProfileRef);
  
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
    
    // Final conflict check before adding document
    const bookingsColRef = collection(firestore, 'bookings');
    const existingBookingsQuery = query(
        bookingsColRef,
        where('listingId', '==', property.id),
        where('status', '==', 'confirmed')
    );

    try {
        const snapshot = await getDocs(existingBookingsQuery);
        const hasConflict = snapshot.docs.some(docSnap => {
            const booking = docSnap.data() as Booking;
            return areIntervalsOverlapping(
                { start: checkinDate, end: checkoutDate },
                { start: booking.checkInDate.toDate(), end: booking.checkOutDate.toDate() }
            );
        });

        if (hasConflict) {
            toast({
                variant: 'destructive',
                title: 'Dates No Longer Available',
                description: 'Someone just booked these dates. Please try another range.'
            });
            router.push(`/properties/${property.id}`);
            return;
        }

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
          paymentMethodId: paymentMethod,
          createdAt: serverTimestamp(),
          listing: { id: property.id, title: property.title, location: property.location, imageUrl: property.imageUrl },
          guest: { name: user.displayName || user.email, photoURL: user.photoURL },
          host: { name: property.host?.name ?? null, photoURL: property.host?.photoURL ?? null },
        };

        await addDoc(bookingsColRef, bookingData);
        toast({
          title: bookingStatus === 'confirmed' ? 'Reservation Confirmed!' : 'Request Sent!',
          description: bookingStatus === 'confirmed'
            ? 'Your booking is confirmed. Enjoy your trip!'
            : 'Your request has been sent to the host for approval.',
        });
        router.push('/profile?tab=bookings');
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: bookingsColRef.path,
        operation: 'create',
        requestResourceData: { listingId: property.id },
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: 'destructive', title: 'Booking Failed', description: 'Could not submit your reservation. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- Loading & Error States ---
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>;
  }
  if (!property || !isValidBooking) {
    return <InvalidBookingState />;
  }

  const isInstant = property.bookingSettings === 'instant';

  return (
    <div className="container mx-auto py-12 max-w-5xl px-4 md:px-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/properties/${id}`}>
            <ChevronRight className="h-6 w-6 rotate-180" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold font-headline">{isInstant ? 'Confirm and pay' : 'Request to book'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        {/* Left Column: Details & Payment */}
        <div className="space-y-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Your trip</h2>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">Dates</p>
                <p className="text-muted-foreground">{checkinDate ? format(checkinDate, 'MMM d') : ''} – {checkoutDate ? format(checkoutDate, 'd, yyyy') : ''}</p>
              </div>
              <Button variant="link" className="underline" asChild>
                <Link href={`/properties/${id}`}>Edit</Link>
              </Button>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">Guests</p>
                <p className="text-muted-foreground">{guestsStr} guest{parseInt(guestsStr || '1', 10) > 1 ? 's' : ''}</p>
              </div>
              <Button variant="link" className="underline" asChild>
                <Link href={`/properties/${id}`}>Edit</Link>
              </Button>
            </div>
          </section>

          <Separator />

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Pay with</h2>
              <div className="flex gap-2">
                <Image src="https://placehold.co/40x25?text=VISA" alt="Visa" width={40} height={25} className="border rounded" />
                <Image src="https://placehold.co/40x25?text=MC" alt="Mastercard" width={40} height={25} className="border rounded" />
              </div>
            </div>

            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-4">
                  <RadioGroupItem value="card_1" id="card_1" />
                  <Label htmlFor="card_1" className="flex items-center gap-3 cursor-pointer">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">•••• 4242</p>
                      <p className="text-xs text-muted-foreground">Expires 12/26</p>
                    </div>
                  </Label>
                </div>
                {paymentMethod === 'card_1' && <Check className="h-5 w-5 text-primary" />}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-4">
                  <RadioGroupItem value="card_new" id="card_new" />
                  <Label htmlFor="card_new" className="font-medium cursor-pointer">Add a new credit or debit card</Label>
                </div>
              </div>
            </RadioGroup>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Cancellation policy</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Cancel before {format(checkinDate || new Date(), 'MMM d')} for a full refund. After that, the first night is non-refundable.
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              By selecting the button below, I agree to the <span className="underline cursor-pointer">Host's House Rules</span>, <span className="underline cursor-pointer">StayNest's Ground Rules for Guests</span>, and that StayNest can charge my payment method if I'm responsible for damage.
            </p>
            <Button 
              className="w-full md:w-auto px-12 py-6 text-lg bg-pink-600 hover:bg-pink-700 text-white font-bold" 
              onClick={handleConfirmAndBook}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isInstant ? 'Confirm and Book' : 'Request to Book')}
            </Button>
          </section>
        </div>

        {/* Right Column: Price Summary Card */}
        <div className="lg:block">
          <Card className="sticky top-24 border-muted shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="relative h-24 w-32 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={property.imageUrl} alt={property.title} fill className="object-cover" />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{property.propertyType}</p>
                    <h3 className="font-semibold line-clamp-2">{property.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="font-bold">{property.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({property.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Price details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="underline">₦{(property.pricePerNight || 0).toLocaleString()} x {duration} nights</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="underline">Cleaning fee</span>
                    <span>₦{(property.cleaningFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="underline">StayNest service fee</span>
                    <span>₦{(property.serviceFee || 0).toLocaleString()}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total (NGN)</span>
                  <span>₦{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
