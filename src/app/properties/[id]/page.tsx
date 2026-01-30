'use client';

import Image from "next/image";
import { notFound, useParams, useRouter } from "next/navigation";
import * as React from 'react';
import {
  Star,
  MapPin,
  Users,
  BedDouble,
  Bath,
  Wifi,
  Tv,
  ParkingCircle,
  Soup,
  Wind,
  Plus,
  Loader2,
  Expand,
  Heart,
  Home,
  User,
  Users2,
  Sparkles,
  Edit,
  ChevronDown,
  MessageSquare,
  Repeat,
  Calendar as CalendarIcon,
  Info,
  Tag,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDoc, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError, useCollection } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp, Timestamp, deleteDoc, setDoc, getDoc, query, orderBy, where, limit } from "firebase/firestore";
import type { Property, Review, Booking } from "@/lib/types";
import { DateRange } from "react-day-picker";
import { differenceInCalendarDays, format, eachDayOfInterval, getDay, isWithinInterval, startOfDay, areIntervalsOverlapping, isSameDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { propertyTypes, guestSpaces, whoElseOptions } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/utils";


const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1200;

export default function PropertyPage() {
  const params = useParams();
  const id = params?.id as string;
  const firestore = useFirestore();
  const [retryCount, setRetryCount] = React.useState(0);
  
  const propertyRef = useMemoFirebase(
    () => (firestore && id) ? doc(firestore, "listings", id) : null,
    [firestore, id]
  );
  
  const { data: property, isLoading, error } = useDoc<Property>(propertyRef);

  React.useEffect(() => {
    if (!isLoading && !property && !error && retryCount < MAX_RETRIES) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        const recheck = async () => {
          if (propertyRef) {
            await getDoc(propertyRef);
          }
        };
        recheck();

      }, RETRY_DELAY_MS);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, property, error, retryCount, propertyRef]);


  if (isLoading && retryCount === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-12 w-12" />
      </div>
    );
  }
  
  if (!isLoading && !property && retryCount >= MAX_RETRIES) {
    notFound();
  }

  if (!property) {
     return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-12 w-12" />
        <p className="ml-4 text-muted-foreground">Locating listing...</p>
      </div>
    );
  }

  return <PropertyDetails property={property} />;
}

function HostDetails({ property }: { property: Property }) {
  const hostName = property.host?.name || "Host";
  const hostAvatarUrl = property.host?.photoURL;
  const hostAvatarFallback = hostName.charAt(0);
  
  const propertyTypeLabel = propertyTypes.find(p => p.id === property.propertyType)?.label || 'Property';

  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-semibold">
          {propertyTypeLabel} hosted by{' '}
           <Link href={`/users/${property.ownerId}`} className="underline hover:text-primary">
            {hostName}
           </Link>
        </h2>
        <div className="flex items-center gap-4 text-muted-foreground mt-1">
          <span>{property.maxGuests} guests</span>
          <span>&middot;</span>
          <span>{property.bedrooms} bedroom{property.bedrooms !== 1 ? 's' : ''}</span>
          <span>&middot;</span>
           <span>{property.beds} bed{property.beds !== 1 ? 's' : ''}</span>
          <span>&middot;</span>
          <span>{property.bathrooms} bathroom{property.bathrooms !== 1 ? 's' : ''}</span>
        </div>
      </div>
       <Link href={`/users/${property.ownerId}`} className="cursor-pointer">
        <Avatar className="h-16 w-16">
          {hostAvatarUrl && <AvatarImage src={hostAvatarUrl} alt={hostName} />}
          <AvatarFallback className="text-2xl">{hostAvatarFallback}</AvatarFallback>
        </Avatar>
      </Link>
    </div>
  );
}

const amenityIcons: { [key: string]: React.ElementType } = {
    Wifi, Kitchen: Soup, "Free parking": ParkingCircle, Heating: Wind, TV: Tv, "Air conditioning": Wind, Pool: Sparkles, Elevator: Users, Gym: Users, Washer: Plus, Dryer: Plus, Iron: Plus, "Hair dryer": Plus, Crib: Plus, "High chair": Plus, Workspace: Plus, "Self check-in": Plus, "Pets allowed": Plus,
};

function ReviewsSection({ propertyId, property }: { propertyId: string; property: Property }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isOwner = user?.uid === property.ownerId;

  const reviewsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'listings', propertyId, 'reviews'), orderBy('createdAt', 'desc')) : null,
    [firestore, propertyId]
  );
  const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);
  
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Please log in to leave a review."});
      return;
    }
    if (rating === 0 || comment.trim() === '') {
      toast({ variant: "destructive", title: "Please provide a rating and a comment."});
      return;
    }
    
    setIsSubmitting(true);
    
    const reviewColRef = collection(firestore, 'listings', propertyId, 'reviews');

    const reviewData = {
        listingId: propertyId,
        userId: user.uid,
        rating,
        comment,
        createdAt: serverTimestamp(),
        user: {
            name: user.displayName,
            photoURL: user.photoURL,
        }
    };
    
    try {
        await addDoc(reviewColRef, reviewData);
        toast({ title: "Review submitted!" });
        setRating(0);
        setComment('');
    } catch (error: any) {
        const permissionError = new FirestorePermissionError({
            path: reviewColRef.path,
            operation: 'create',
            requestResourceData: reviewData,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isOwner) {
    return null;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Star className="w-5 h-5" />
        <span>Reviews ({reviews?.length || 0})</span>
      </h3>
      
      {user && (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Leave a Review</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                        <span className="text-sm font-medium">Rating</span>
                        <div className="flex items-center gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-6 h-6 cursor-pointer ${rating >= star ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                    </div>
                     <div>
                        <label htmlFor="comment" className="text-sm font-medium">Comment</label>
                        <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Review
                    </Button>
                </form>
            </CardContent>
        </Card>
      )}

      {isLoading && <Loader2 className="animate-spin" />}
      {!isLoading && reviews && reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review.id} className="flex gap-4">
                <Avatar>
                    <AvatarImage src={review.user?.photoURL || ''} alt={review.user?.name || ''} />
                    <AvatarFallback>{review.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{review.user?.name}</span>
                        {review.createdAt && (
                          <span className="text-xs text-muted-foreground">{format(review.createdAt.toDate(), 'PPP')}</span>
                        )}
                    </div>
                     <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                           <Star key={star} className={`w-4 h-4 ${review.rating >= star ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                        ))}
                    </div>
                    <p className="mt-2 text-sm text-foreground/80">{review.comment}</p>
                </div>
            </div>
          ))}
        </div>
      ) : (
         !isLoading && <p className="text-muted-foreground">Be the first to review this listing!</p>
      )}
    </div>
  );
}


function PropertyDetails({ property }: { property: Property }) {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [guests, setGuests] = React.useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);

  // Fetch all confirmed bookings for this listing to block out the calendar
  const confirmedBookingsQuery = useMemoFirebase(
    () => firestore ? query(
      collection(firestore, 'bookings'),
      where('listingId', '==', property.id),
      where('status', '==', 'confirmed')
    ) : null,
    [firestore, property.id]
  );
  const { data: confirmedBookings } = useCollection<Booking>(confirmedBookingsQuery);

  const disabledDates = React.useMemo(() => {
    const dates: (Date | { before: Date })[] = [{ before: new Date() }];
    
    if (confirmedBookings) {
      confirmedBookings.forEach(booking => {
        const start = booking.checkInDate.toDate();
        const end = booking.checkOutDate.toDate();
        // Add every single day in the interval to the disabled list
        const interval = eachDayOfInterval({ start, end });
        dates.push(...interval);
      });
    }
    
    return dates;
  }, [confirmedBookings]);

  const handleDayClick = (day: Date, modifiers: any) => {
    if (isOwner) {
        // Find if this day belongs to a booking
        const booking = confirmedBookings?.find(b => {
            const start = b.checkInDate.toDate();
            const end = b.checkOutDate.toDate();
            return isWithinInterval(day, { start, end });
        });
        if (booking) {
            setSelectedBooking(booking);
        } else {
            setSelectedBooking(null);
        }
        return;
    }

    if (modifiers.disabled) {
      const isPast = day < startOfDay(new Date());
      toast({
        variant: "destructive",
        title: isPast ? "Date Unavailable" : "Already Booked",
        description: isPast ? "This date is in the past." : "These dates are already reserved by another guest.",
      });
    }
  };

  const userFavoritesQuery = useMemoFirebase(
    () => (user && firestore) ? collection(firestore, `users/${user.uid}/favorites`) : null,
    [user, firestore]
  );
  const { data: favorites } = useCollection(userFavoritesQuery);
  const isFavorited = React.useMemo(() => favorites?.some(fav => fav.id === property.id), [favorites, property.id]);
  
  const pastBookingsQuery = useMemoFirebase(
    () => (user && firestore) ? query(collection(firestore, 'bookings'), where('listingId', '==', property.id), where('guestId', '==', user.uid), where('status', '==', 'confirmed'), limit(1)) : null,
    [user, firestore, property.id]
  );
  const { data: pastBookings } = useCollection(pastBookingsQuery);
  const hasBookedBefore = pastBookings && pastBookings.length > 0;

  const isOwner = user?.uid === property.ownerId;
  
  const { subtotal, duration, dayPrice, discountAmount, discountLabel } = React.useMemo(() => {
    if (!date?.from) {
      return { subtotal: 0, duration: 0, dayPrice: property.pricePerNight, discountAmount: 0, discountLabel: null };
    }

    if (!date.to) {
       const fromDayOfWeek = getDay(date.from);
       const isWeekend = fromDayOfWeek === 5 || fromDayOfWeek === 6;
       const price = isWeekend && property.weekendPrice > 0 ? property.weekendPrice : property.pricePerNight;
       return { subtotal: 0, duration: 0, dayPrice: price, discountAmount: 0, discountLabel: null };
    }
    
    const days = eachDayOfInterval({ start: date.from, end: date.to });
    const bookingDuration = differenceInCalendarDays(date.to, date.from);
    
    if (bookingDuration <= 0) {
      return { subtotal: 0, duration: 0, dayPrice: property.pricePerNight, discountAmount: 0, discountLabel: null };
    }

    const sub = days.slice(0, -1).reduce((acc, day) => {
      const dayOfWeek = getDay(day);
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const price = isWeekend && property.weekendPrice > 0 ? property.weekendPrice : property.pricePerNight;
      return acc + price;
    }, 0);

    const fromDayOfWeek = getDay(date.from);
    const isFromWeekend = fromDayOfWeek === 5 || fromDayOfWeek === 6;
    const price = isFromWeekend && property.weekendPrice > 0 ? property.weekendPrice : property.pricePerNight;

    // Apply Discounts logic
    let appliedDiscount = 0;
    let label = null;

    if (property.monthlyDiscount && bookingDuration >= 28) {
        appliedDiscount = 0.10;
        label = "Monthly Stay Discount";
    } else if (property.weeklyDiscount && bookingDuration >= 7) {
        appliedDiscount = 0.05;
        label = "Weekly Stay Discount";
    } else if (property.newListingPromotion && (property.reviewCount || 0) < 3) {
        appliedDiscount = 0.20;
        label = "New Listing Promotion";
    }

    const savings = Math.round(sub * appliedDiscount);

    return { subtotal: sub, duration: bookingDuration, dayPrice: price, discountAmount: savings, discountLabel: label };
  }, [date, property.pricePerNight, property.weekendPrice, property.monthlyDiscount, property.weeklyDiscount, property.newListingPromotion, property.reviewCount]);

  const cleaningFee = property?.cleaningFee || 0;
  const serviceFee = property?.serviceFee || 0;
  const totalPrice = (subtotal - discountAmount) + cleaningFee + serviceFee;

  const handleFavoriteToggle = async () => {
    if (!user || !property || !firestore) {
      toast({ variant: "destructive", title: "Please log in" });
      router.push('/login');
      return;
    }

    const favoriteRef = doc(firestore, `users/${user.uid}/favorites`, property.id);

    try {
      if (isFavorited) {
        await deleteDoc(favoriteRef);
        toast({ title: "Removed from favorites." });
      } else {
        await setDoc(favoriteRef, { 
          listingId: property.id,
          favoritedAt: serverTimestamp() 
        });
        toast({ title: "Added to favorites!" });
      }
    } catch (error: any) {
       const permissionError = new FirestorePermissionError({
          path: favoriteRef.path,
          operation: isFavorited ? 'delete' : 'create',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  };

  const handleReservation = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Required" });
      router.push('/login');
      return;
    }

    if (!property || !date?.from || !date?.to || !duration || duration <= 0) {
      toast({ variant: "destructive", title: "Please select valid dates." });
      return;
    }

    const hasConflict = confirmedBookings?.some(booking => {
        return areIntervalsOverlapping(
          { start: date.from!, end: date.to! },
          { start: booking.checkInDate.toDate(), end: booking.checkOutDate.toDate() }
        );
    });

    if (hasConflict) {
        toast({ variant: "destructive", title: "Dates Unavailable", description: "Sorry, these dates were just booked." });
        return;
    }

    const checkin = format(date.from, 'yyyy-MM-dd');
    const checkout = format(date.to, 'yyyy-MM-dd');
    router.push(`/book/${property.id}?checkin=${checkin}&checkout=${checkout}&guests=${guests}`);
  };
  
  const images = property.imageUrls || [property.imageUrl];
  const reviewCount = property.reviewCount || 0;
  const rating = property.rating || 0;
  const ratingDisplay = reviewCount > 0 ? `${rating.toFixed(1)} (${reviewCount} reviews)` : 'New listing';

  const guestSpaceLabel = guestSpaces.find(g => g.id === property.guestSpace)?.label || 'Space';
  const WhoElseDisplay = () => {
    if (!property.whoElse || property.whoElse.length === 0) {
      return null;
    }
    const who = property.whoElse.map(id => whoElseOptions.find(o => o.id === id)?.label).join(', ');
    return <p className="flex items-center gap-2"><Users2 className="h-5 w-5" /> You may be sharing the space with: {who}</p>;
  };

  return (
    <div className="container mx-auto py-8 lg:py-12 px-4">
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-start">
            <h1 className="text-3xl lg:text-4xl font-bold font-headline">
            {property.title}
            </h1>
            <div className="flex gap-2">
                {isOwner ? (
                  <Button variant="outline" asChild>
                    <Link href={`/properties/edit/${property.id}`}>
                      <Edit className="mr-2 h-5 w-5" />
                      Edit Listing
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleFavoriteToggle}>
                    <Heart className={`mr-2 h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFavorited ? 'Favorited' : 'Favorite'}
                  </Button>
                )}
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-semibold text-foreground">{ratingDisplay}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{property.location}</span>
          </div>
          {hasBookedBefore && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <Repeat className="w-4 h-4" />
                <span>You've stayed here before</span>
              </div>
            </>
          )}
        </div>
      </div>

       <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
         <Carousel className="w-full mb-8">
          <CarouselContent>
            {images.map((url, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                 <DialogTrigger asChild onClick={() => setSelectedImageIndex(index)}>
                 <div className="relative aspect-video group cursor-pointer">
                    <Image
                      src={url}
                      alt={`${property.title} image ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-black/50 text-white p-2 rounded-full">
                           <Expand className="w-5 h-5" />
                        </div>
                    </div>
                 </div>
                 </DialogTrigger>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
        </Carousel>
        <DialogContent className="max-w-4xl p-0 border-0">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Full-size view of {property.title}
            </DialogTitle>
          </DialogHeader>
          {selectedImageIndex !== null && (
            <Carousel opts={{startIndex: selectedImageIndex}} className="w-full">
                <CarouselContent>
                    {images.map((url, index) => (
                        <CarouselItem key={index}>
                            <div className="relative w-full h-[80vh]">
                                <Image
                                    src={url}
                                    alt={`${property.title} image ${index + 1}`}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
            </Carousel>
          )}
        </DialogContent>
      </Dialog>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="border-b pb-6">
            <HostDetails property={property} />
          </div>
          
          <div className="border-b pb-6 space-y-4">
              <p className="flex items-center gap-2 font-medium"><Home className="h-5 w-5" /> {guestSpaceLabel}</p>
              <WhoElseDisplay />
          </div>

          <div className="border-b pb-6">
            <p className="text-foreground/90 whitespace-pre-line leading-relaxed">{property.description}</p>
          </div>

          <div className="border-b pb-6">
            <h3 className="text-xl font-semibold mb-4">What this place offers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {property.amenities && property.amenities.map((amenity) => {
                const Icon = amenityIcons[amenity] || Plus;
                return (
                  <div key={amenity} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <span>{amenity}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-b pb-6">
            <ReviewsSection propertyId={property.id} property={property} />
          </div>
        </div>

        <div className="lg:col-span-1">
            {isOwner ? (
                <Card className="sticky top-24 shadow-lg border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            Host Calendar View
                        </CardTitle>
                        <CardDescription>
                            Review guest stays and manage availability.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-2 border rounded-lg bg-background">
                            <TooltipProvider>
                                <Calendar
                                    mode="single"
                                    onDayClick={handleDayClick}
                                    className="p-0"
                                    modifiers={{
                                        booked: (day) => confirmedBookings?.some(b => 
                                            isWithinInterval(day, { 
                                                start: b.checkInDate.toDate(), 
                                                end: b.checkOutDate.toDate() 
                                            })
                                        ) ?? false
                                    }}
                                    modifiersClassNames={{
                                        booked: "bg-primary/20 text-primary font-bold rounded-full hover:bg-primary/30"
                                    }}
                                />
                            </TooltipProvider>
                        </div>

                        {selectedBooking ? (
                            <Card className="border-primary/20 animate-in fade-in slide-in-from-top-2">
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-sm text-primary uppercase">Booking Details</h4>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedBooking(null)}>
                                            < ChevronDown className="h-4 w-4 rotate-180" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={selectedBooking.guest?.photoURL} />
                                            <AvatarFallback>{selectedBooking.guest?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-semibold">{selectedBooking.guest?.name || 'Guest'}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                                {selectedBooking.guests} Guest{selectedBooking.guests !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Stay</span>
                                            <span className="font-medium">
                                                {format(selectedBooking.checkInDate.toDate(), 'MMM d')} - {format(selectedBooking.checkOutDate.toDate(), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Payout</span>
                                            <span className="font-bold text-primary">₦{selectedBooking.totalPrice?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full text-xs h-8" asChild>
                                        <Link href="/messages">
                                            <MessageSquare className="mr-2 h-3 w-3" /> Message Guest
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center bg-background/50">
                                <Info className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                                <p className="text-sm text-muted-foreground">Click a highlighted date to see guest details.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card className="sticky top-24 shadow-lg border-muted">
                    <CardHeader>
                    <CardTitle className="text-2xl">
                        {duration > 0 ? (
                            <>
                            <span className="font-bold">₦{totalPrice.toLocaleString()}</span>
                            <span className="ml-1 text-base font-normal text-muted-foreground"> for {duration} night{duration !== 1 ? 's' : ''}</span>
                            </>
                        ) : (
                            <>
                            <span className="font-bold">₦{dayPrice.toLocaleString()}</span>
                            <span className="ml-1 text-base font-normal text-muted-foreground">/ night</span>
                            </>
                        )}
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={'outline'}
                            className="w-full justify-start text-left font-normal h-auto p-0 overflow-hidden"
                            >
                            <div className="grid grid-cols-2 w-full divide-x">
                                <div className="p-3 hover:bg-accent transition-colors">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Check-in</p>
                                    <p className="text-sm font-medium">{date?.from ? format(date.from, 'dd/MM/yyyy') : 'Add date'}</p>
                                </div>
                                <div className="p-3 hover:bg-accent transition-colors">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Checkout</p>
                                    <p className="text-sm font-medium">{date?.to ? format(date.to, 'dd/MM/yyyy') : 'Add date'}</p>
                                </div>
                            </div>
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <TooltipProvider>
                            <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={1}
                            disabled={disabledDates}
                            showOutsideDays={false}
                            onDayClick={handleDayClick}
                            />
                        </TooltipProvider>
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={'outline'}
                            className="w-full justify-between text-left font-normal h-auto py-3 px-4"
                            >
                            <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Guests</p>
                            <p className="text-sm font-medium">{guests} guest{guests !== 1 ? 's' : ''}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-4">
                        <div className="flex items-center justify-between gap-8">
                            <div>
                                <p className="font-bold">Guests</p>
                                <p className="text-xs text-muted-foreground">Max {property.maxGuests}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setGuests(g => Math.max(1, g - 1))} disabled={guests <= 1}>-</Button>
                                <span className="w-4 text-center font-medium">{guests}</span>
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setGuests(g => Math.min(property.maxGuests, g + 1))} disabled={guests >= property.maxGuests}>+</Button>
                            </div>
                        </div>
                        </PopoverContent>
                    </Popover>

                    <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold" size="lg" onClick={handleReservation} disabled={!date?.from || !date?.to || duration <= 0}>
                        {property.bookingSettings === 'instant' ? 'Reserve' : 'Request to Book'}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">You won't be charged yet</p>

                    {duration > 0 && (
                        <div className="space-y-3 text-sm pt-4 border-t">
                        <div className="flex justify-between">
                            <span className="underline">₦{dayPrice.toLocaleString()} x {duration} nights</span>
                            <span>₦{subtotal.toLocaleString()}</span>
                        </div>
                        
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-green-600 font-semibold">
                                <div className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    <span>{discountLabel}</span>
                                </div>
                                <span>-₦{discountAmount.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="underline">Cleaning fee</span>
                            <span>₦{cleaningFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="underline">Service fee</span>
                            <span>₦{serviceFee.toLocaleString()}</span>
                        </div>
                        <Separator className="my-1" />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>₦{totalPrice.toLocaleString()}</span>
                        </div>
                        </div>
                    )}
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}
