
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Star, CreditCard, ChevronRight, Check, AlertCircle, Tag, Plus, ShieldCheck } from 'lucide-react';
import type { Property, User as UserType, Booking } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { usePaystackPayment } from 'react-paystack';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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

function PaymentIcon({ brand }: { brand: 'VISA' | 'MC' }) {
  return (
    <div className={brand === 'VISA' ? "bg-blue-800 text-white px-2 py-0.5 rounded text-[10px] font-black italic tracking-tighter" : "bg-orange-600 text-white px-2 py-0.5 rounded text-[10px] font-black italic tracking-tighter"}>
      {brand}
    </div>
  );
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
  const [isAddingCard, setIsAddingCard] = React.useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = React.useState<string | null>(null);
  const [addCardDialogOpen, setAddCardDialogOpen] = React.useState(false);

  const propertyRef = useMemoFirebase(
    () => (firestore && id) ? doc(firestore, 'listings', id) : null,
    [firestore, id]
  );
  const { data: property, isLoading } = useDoc<Property>(propertyRef);

  const paymentMethodsRef = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'users', user.uid, 'payment_methods') : null),
    [user, firestore]
  );
  const { data: paymentMethods, isLoading: isMethodsLoading } = useCollection(paymentMethodsRef);

  React.useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !selectedPaymentId) {
      setSelectedPaymentId(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPaymentId]);
  
  const checkinStr = searchParams.get('checkin');
  const checkoutStr = searchParams.get('checkout');
  const guestsStr = searchParams.get('guests');

  const { checkinDate, checkoutDate, duration, subtotal, totalPrice, discountAmount, discountLabel, isValidBooking } = React.useMemo(() => {
    if (!checkinStr || !checkoutStr || !guestsStr || !property) {
      return { isValidBooking: false, duration: 0, subtotal: 0, totalPrice: 0, discountAmount: 0, discountLabel: null, checkinDate: null, checkoutDate: null };
    }
    
    const cIn = parseISO(checkinStr);
    const cOut = parseISO(checkoutStr);

    if (!isValid(cIn) || !isValid(cOut) || !guestsStr) {
      return { isValidBooking: false, duration: 0, subtotal: 0, totalPrice: 0, discountAmount: 0, discountLabel: null, checkinDate: null, checkoutDate: null };
    }

    const dur = differenceInCalendarDays(cOut, cIn);
    if (dur <= 0) {
      return { isValidBooking: false, duration: 0, subtotal: 0, totalPrice: 0, discountAmount: 0, discountLabel: null, checkinDate: cIn, checkoutDate: cOut };
    }

    const price = property.pricePerNight || 0;
    const cleaning = property.cleaningFee || 0;
    const service = property.serviceFee || 0;

    const sub = price * dur;
    
    let appliedDiscount = 0;
    let label = null;

    if (property.monthlyDiscount && dur >= 28) {
        appliedDiscount = 0.10;
        label = "Monthly Stay Discount";
    } else if (property.weeklyDiscount && dur >= 7) {
        appliedDiscount = 0.05;
        label = "Weekly Stay Discount";
    } else if (property.newListingPromotion && (property.reviewCount || 0) < 3) {
        appliedDiscount = 0.20;
        label = "New Listing Promotion";
    }

    const savings = Math.round(sub * appliedDiscount);
    const total = (sub - savings) + cleaning + service;
    
    return { 
        isValidBooking: true, 
        checkinDate: cIn, 
        checkoutDate: cOut, 
        duration: dur, 
        subtotal: sub, 
        discountAmount: savings,
        discountLabel: label,
        totalPrice: total 
    };
  }, [checkinStr, checkoutStr, guestsStr, property]);

  const paystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || '',
    amount: totalPrice * 100, // Paystack amount is in Kobo
    publicKey: 'pk_test_YOUR_PAYSTACK_KEY', // Replace with your real test key
    currency: 'NGN',
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const handleAddCard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !paymentMethodsRef) return;

    setIsAddingCard(true);
    const formData = new FormData(e.currentTarget);
    const cardNumber = formData.get('cardNumber')?.toString() || '';
    const lastFour = cardNumber.slice(-4) || '4242';

    const cardData = {
      lastFour,
      expiry: formData.get('expiry'),
      type: 'visa',
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(paymentMethodsRef, cardData);
      setSelectedPaymentId(docRef.id);
      setAddCardDialogOpen(false);
      toast({ title: 'Success', description: 'Payment method saved.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save card.' });
    } finally {
      setIsAddingCard(false);
    }
  };

  const saveBookingToFirestore = async (paymentRef?: string) => {
    if (!user || !property || !checkinDate || !checkoutDate || !guestsStr) return;

    const bookingsColRef = collection(firestore, 'bookings');
    const isInstant = property.bookingSettings === 'instant';
    const bookingStatus = isInstant ? 'confirmed' : 'pending';

    const bookingData = {
      guestId: user.uid,
      hostId: property.ownerId,
      listingId: property.id,
      checkInDate: Timestamp.fromDate(checkinDate),
      checkOutDate: Timestamp.fromDate(checkoutDate),
      guests: parseInt(guestsStr, 10),
      totalPrice,
      status: bookingStatus,
      paymentMethodId: selectedPaymentId,
      paymentReference: paymentRef || null,
      createdAt: serverTimestamp(),
      listing: { id: property.id, title: property.title, location: property.location, imageUrl: property.imageUrl },
      guest: { name: user.displayName || user.email, photoURL: user.photoURL },
      host: { name: property.host?.name ?? null, photoURL: property.host?.photoURL ?? null },
    };

    try {
        const newBookingRef = await addDoc(bookingsColRef, bookingData);
        
        if (isInstant) {
            const messagesColRef = collection(firestore, `bookings/${newBookingRef.id}/messages`);
            await addDoc(messagesColRef, {
                bookingId: newBookingRef.id,
                senderId: property.ownerId,
                receiverId: user.uid,
                listingId: property.id,
                text: `Hello! Your instant booking for "${property.title}" has been confirmed. I'll be in touch with check-in details soon.`,
                createdAt: serverTimestamp(),
                isRead: false
            });
        }

        toast({
          title: isInstant ? 'Reservation Confirmed!' : 'Request Sent to Host!',
          description: isInstant
            ? 'Your booking is confirmed. Enjoy your trip!'
            : 'The host will review your request shortly.',
        });
        
        router.push('/profile?tab=bookings');
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: bookingsColRef.path,
        operation: 'create',
        requestResourceData: { listingId: property.id },
      }));
    }
  };

  const handleConfirmAndBook = async () => {
    if (!user || !property || !checkinDate || !checkoutDate || !guestsStr) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Cannot complete booking.' });
      return;
    }

    if (!user.emailVerified && user.providerData.some(p => p.providerId === 'password')) {
        toast({
            variant: 'destructive',
            title: 'Email Verification Required',
            description: 'Please verify your email address before booking.',
        });
        return;
    }

    if (!selectedPaymentId) {
      toast({ variant: 'destructive', title: 'Payment Required', description: 'Please select a payment method.' });
      return;
    }

    setIsSubmitting(true);
    
    // Check for double-booking conflicts before launching payment
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
                description: 'Someone just booked these dates. Please try different dates.'
            });
            setIsSubmitting(false);
            router.back();
            return;
        }

        // Initialize Paystack Payment Flow
        initializePayment({
            onSuccess: (reference: any) => {
                // reference.reference is the transaction ID from Paystack
                saveBookingToFirestore(reference.reference);
            },
            onClose: () => {
                setIsSubmitting(false);
                toast({ title: "Payment Cancelled", description: "Your transaction was not completed." });
            }
        });

    } catch (error: any) {
      console.error(error);
      setIsSubmitting(false);
    }
  };
  
  if (isLoading || isMethodsLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }
  if (!property || !isValidBooking) {
    return <InvalidBookingState />;
  }

  const isInstant = property.bookingSettings === 'instant';

  return (
    <div className="container mx-auto py-12 max-w-5xl px-4 md:px-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronRight className="h-6 w-6 rotate-180" />
        </Button>
        <h1 className="text-3xl font-bold font-headline">{isInstant ? 'Confirm and pay' : 'Request to book'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        <div className="space-y-12">
          {!isInstant && (
            <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-800">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">Your reservation won't be confirmed yet</p>
                <p className="text-sm">The host has 24 hours to accept or decline your request. Your payment will be processed via Paystack immediately.</p>
              </div>
            </div>
          )}

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Your trip</h2>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-sm">Dates</p>
                <p className="text-muted-foreground">{checkinDate ? format(checkinDate, 'MMM d') : ''} – {checkoutDate ? format(checkoutDate, 'd, yyyy') : ''}</p>
              </div>
              <Button variant="link" className="underline" onClick={() => router.back()}>Edit</Button>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-sm">Guests</p>
                <p className="text-muted-foreground">{guestsStr} guest{parseInt(guestsStr || '1', 10) > 1 ? 's' : ''}</p>
              </div>
              <Button variant="link" className="underline" onClick={() => router.back()}>Edit</Button>
            </div>
          </section>

          <Separator />

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Pay with Paystack</h2>
              <div className="flex gap-2">
                <PaymentIcon brand="VISA" />
                <PaymentIcon brand="MC" />
              </div>
            </div>

            {paymentMethods && paymentMethods.length > 0 ? (
              <div className="space-y-4">
                <RadioGroup value={selectedPaymentId || ''} onValueChange={setSelectedPaymentId} className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-4">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">•••• {method.lastFour}</p>
                            <p className="text-xs text-muted-foreground">Expires {method.expiry}</p>
                          </div>
                        </Label>
                      </div>
                      {selectedPaymentId === method.id && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  ))}
                </RadioGroup>
                
                <Dialog open={addCardDialogOpen} onOpenChange={setAddCardDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add another card
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleAddCard}>
                      <DialogHeader>
                        <DialogTitle>Add Card</DialogTitle>
                        <DialogDescription>
                          Enter your card details to save for future reservations.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="card-number">Card Number</Label>
                          <Input id="card-number" name="cardNumber" placeholder="4242 4242 4242 4242" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="expiry">Expiry</Label>
                            <Input id="expiry" name="expiry" placeholder="MM/YY" required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="cvc">CVC</Label>
                            <Input id="cvc" name="cvc" placeholder="123" required />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isAddingCard}>
                          {isAddingCard && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Card
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-4">
                <p className="text-muted-foreground">You don't have any saved payment methods.</p>
                <Dialog open={addCardDialogOpen} onOpenChange={setAddCardDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Add a Payment Method</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleAddCard}>
                      <DialogHeader>
                        <DialogTitle>Add Card</DialogTitle>
                        <DialogDescription>
                          Enter your card details to save for future reservations.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="card-number">Card Number</Label>
                          <Input id="card-number" name="cardNumber" placeholder="4242 4242 4242 4242" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="expiry">Expiry</Label>
                            <Input id="expiry" name="expiry" placeholder="MM/YY" required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="cvc">CVC</Label>
                            <Input id="cvc" name="cvc" placeholder="123" required />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isAddingCard}>
                          {isAddingCard && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Card
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
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
              By selecting the button below, I agree to the <span className="underline cursor-pointer">Host's House Rules</span> and <span className="underline cursor-pointer">StayNest's Ground Rules</span>. Your payment will be processed securely through Paystack.
            </p>
            <Button 
              className="w-full md:w-auto px-12 py-6 text-lg bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-lg" 
              onClick={handleConfirmAndBook}
              disabled={isSubmitting || !selectedPaymentId}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isInstant ? 'Confirm and Pay' : 'Pay and Request')}
            </Button>
            
            <div className="flex items-center justify-center gap-2 mt-4 text-green-600 font-bold text-[10px] uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4" />
                <span>Secured by Paystack</span>
            </div>
          </section>
        </div>

        <div className="lg:block">
          <Card className="sticky top-24 border-muted shadow-lg">
            <CardContent className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="relative h-24 w-32 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={property.imageUrl} alt={property.title} fill className="object-cover" />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{property.propertyType}</p>
                    <h3 className="font-semibold line-clamp-2 text-sm">{property.title}</h3>
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
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span className="underline">₦{(property.pricePerNight || 0).toLocaleString()} x {duration} nights</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 text-sm font-semibold">
                        <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <span>{discountLabel}</span>
                        </div>
                        <span>-₦{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span className="underline">Cleaning fee</span>
                    <span>₦{(property.cleaningFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span className="underline">StayNest service fee</span>
                    <span>₦{(property.serviceFee || 0).toLocaleString()}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg text-primary">
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
