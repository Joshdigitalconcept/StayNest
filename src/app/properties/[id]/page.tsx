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
  XCircle,
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
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
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
        <Avatar className="h-16 w-16 border-2 border-muted hover:border-primary transition-colors">
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
        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
        <span>Reviews ({reviews?.length || 0})</span>
      </h3>
      
      {user && (
        <Card className="mb-8 border-muted shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Leave a Review</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                        <span className="text-sm font-medium text-muted-foreground">How was your stay?</span>
                        <div className="flex items-center gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-8 h-8 cursor-pointer transition-colors ${rating >= star ? 'text-amber-500 fill-amber-500' : 'text-muted hover:text-amber-200'}`}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                    </div>
                     <div>
                        <label htmlFor="comment" className="text-sm font-medium text-muted-foreground">Your Feedback</label>
                        <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share details of your experience..." className="mt-1" />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Review
                    </Button>
                </form>
            </CardContent>
        </Card>
      )}

      {isLoading && <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>}
      {!isLoading && reviews && reviews.length > 0 ? (
        <div className="space-y-8 mt-8">
          {reviews.map(review => (
            <div key={review.id} className="flex gap-4 group">
                <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={review.user?.photoURL || ''} alt={review.user?.name || ''} />
                    <AvatarFallback>{review.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <span className="font-bold">{review.user?.name}</span>
                        {review.createdAt && (
                          <span className="text-xs text-muted-foreground">{format(review.createdAt.toDate(), 'MMM d, yyyy')}</span>
                        )}
                    </div>
                     <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                           <Star key={star} className={`w-3.5 h-3.5 ${review.rating >= star ? 'text-amber-500 fill-amber-500' : 'text-muted'}`} />
                        ))}
                    </div>
                    <p className="mt-3 text-sm text-foreground/90 leading-relaxed italic">"{review.comment}"</p>
                </div>
            </div>
          ))}
        </div>
      ) : (
         !isLoading && <p className="text-muted-foreground py-8 text-center border rounded-lg border-dashed">No reviews yet. Be the first to share your experience!</p>
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
  const { data: confirmedBookings, isLoading: isBookingsLoading } = useCollection<Booking>(confirmedBookingsQuery);

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

    if (isBookingsLoading) {
        toast({ title: "Checking availability...", description: "Please wait a moment." });
        return;
    }

    const hasConflict = confirmedBookings?.some(booking => {
        return areIntervalsOverlapping(
          { start: date.from!, end: date.to! },
          { start: booking.checkInDate.toDate(), end: booking.checkOutDate.toDate() }
        );
    });

    if (hasConflict) {
        toast({ variant: "destructive", title: "Dates No Longer Available", description: "Sorry, these dates were just confirmed by another guest." });
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
    return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Users2 className="h-4 w-4" /> Shared with: {who}</p>;
  };

  return (
    <div className="container mx-auto py-8 lg:py-12 px-4">
      <div className="space-y-4 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <h1 className="text-3xl lg:text-4xl font-bold font-headline leading-tight">
            {property.title}
            </h1>
            <div className="flex gap-2 shrink-0">
                {isOwner ? (
                  <Button variant="outline" asChild size="sm">
                    <Link href={`/properties/edit/${property.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Listing
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleFavoriteToggle} size="sm">
                    <Heart className={`mr-2 h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFavorited ? 'Favorited' : 'Favorite'}
                  </Button>
                )}
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-bold text-foreground">{ratingDisplay}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="font-medium text-foreground">{property.location}</span>
          </div>
          {hasBookedBefore && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1 text-green-600 font-bold">
                <Repeat className="w-4 h-4" />
                <span>Returning Guest</span>
              </div>
            </>
          )}
        </div>
      </div>

       <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
         <Carousel className="w-full mb-8 group">
          <CarouselContent className="-ml-2 md:-ml-4">
            {images.map((url, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                 <DialogTrigger asChild onClick={() => setSelectedImageIndex(index)}>
                 <div className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border border-muted bg-muted shadow-sm transition-transform hover:scale-[1.02]">
                    <Image
                      src={url}
                      alt={`${property.title} image ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-black/60 text-white p-3 rounded-full backdrop-blur-sm">
                           <Expand className="w-6 h-6" />
                        </div>
                    </div>
                 </div>
                 </DialogTrigger>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 bg-background/80 hover:bg-background border-none opacity-0 group-hover:opacity-100 transition-opacity" />
          <CarouselNext className="right-4 bg-background/80 hover:bg-background border-none opacity-0 group-hover:opacity-100 transition-opacity" />
        </Carousel>
        <DialogContent className="max-w-5xl p-0 border-0 bg-black/95">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Gallery view of {property.title}
            </DialogTitle>
          </DialogHeader>
          {selectedImageIndex !== null && (
            <Carousel opts={{startIndex: selectedImageIndex}} className="w-full">
                <CarouselContent>
                    {images.map((url, index) => (
                        <CarouselItem key={index}>
                            <div className="relative w-full h-[85vh] flex items-center justify-center p-4">
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
                <CarouselPrevious className="left-8 scale-150" />
                <CarouselNext className="right-8 scale-150" />
            </Carousel>
          )}
        </DialogContent>
      </Dialog>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <div className="border-b border-muted pb-8">
            <HostDetails property={property} />
          </div>
          
          <div className="space-y-6">
              <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary">
                    <Home className="h-6 w-6" />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg">{guestSpaceLabel}</h3>
                      <p className="text-muted-foreground text-sm">Guests have access to the defined space as per listing details.</p>
                      <div className="mt-2">
                        <WhoElseDisplay />
                      </div>
                  </div>
              </div>
              <div className="flex items-start gap-4">
                  <div className="bg-accent/10 p-3 rounded-lg text-accent">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg">Unique Features</h3>
                      <p className="text-muted-foreground text-sm">This property stands out for its specific architecture and hospitality style.</p>
                  </div>
              </div>
          </div>

          <div className="border-b border-muted pb-8">
            <h3 className="text-2xl font-bold mb-4 font-headline">Description</h3>
            <p className="text-foreground/80 whitespace-pre-line leading-relaxed text-lg">{property.description}</p>
          </div>

          <div className="border-b border-muted pb-8">
            <h3 className="text-2xl font-bold mb-6 font-headline">What this place offers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12">
              {property.amenities && property.amenities.map((amenity) => {
                const Icon = amenityIcons[amenity] || Plus;
                return (
                  <div key={amenity} className="flex items-center gap-4 group">
                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                        <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-base font-medium">{amenity}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pb-8">
            <ReviewsSection propertyId={property.id} property={property} />
          </div>
        </div>

        <div className="lg:col-span-1">
            {isOwner ? (
                <Card className="sticky top-24 shadow-xl border-primary/30 bg-primary/5 backdrop-blur-sm overflow-hidden">
                    <div className="bg-primary px-6 py-4 text-primary-foreground">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CalendarIcon className="h-5 w-5" />
                            Hosting Dashboard
                        </CardTitle>
                        <p className="text-xs opacity-90 mt-1">Review stays and track occupancy.</p>
                    </div>
                    <CardContent className="space-y-6 pt-6">
                        <div className="p-3 border rounded-xl bg-background shadow-inner flex justify-center">
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
                                />
                            </TooltipProvider>
                        </div>

                        {selectedBooking ? (
                            <Card className="border-primary/20 bg-background animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black text-xs text-primary uppercase tracking-widest">Guest Check-In</h4>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 rounded-full" onClick={() => setSelectedBooking(null)}>
                                            <XCircle className="h-5 w-5 text-muted-foreground" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                                            <AvatarImage src={selectedBooking.guest?.photoURL} />
                                            <AvatarFallback className="bg-muted text-lg">{selectedBooking.guest?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-base">{selectedBooking.guest?.name || 'Guest'}</p>
                                            <p className="text-xs text-muted-foreground font-bold flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {selectedBooking.guests} Traveler{selectedBooking.guests !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <Separator className="bg-muted/50" />
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Stay Duration</span>
                                            <span className="font-bold">
                                                {format(selectedBooking.checkInDate.toDate(), 'MMM d')} - {format(selectedBooking.checkOutDate.toDate(), 'MMM d')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Net Payout</span>
                                            <span className="font-black text-primary text-lg">₦{selectedBooking.totalPrice?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <Button className="w-full font-bold shadow-md" asChild>
                                        <Link href="/messages">
                                            <MessageSquare className="mr-2 h-4 w-4" /> Message Guest
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl text-center bg-background/40">
                                <Info className="h-10 w-10 text-muted-foreground/40 mb-3" />
                                <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                                    Tap a <span className="text-primary font-bold">highlighted date</span> to view specific reservation details.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card className="sticky top-24 shadow-2xl border-muted overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-6 border-b">
                    <CardTitle className="text-3xl flex items-baseline gap-1">
                        {duration > 0 ? (
                            <>
                            <span className="font-black text-primary">₦{totalPrice.toLocaleString()}</span>
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Total</span>
                            </>
                        ) : (
                            <>
                            <span className="font-black text-primary">₦{dayPrice.toLocaleString()}</span>
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-tight">/ night</span>
                            </>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 mt-1">
                        <Tag className="h-3 w-3" />
                        <span>Best Price Guaranteed</span>
                    </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                    
                    <div className="space-y-4">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={'outline'}
                                className="w-full h-auto p-0 rounded-xl border-2 hover:border-primary transition-all overflow-hidden focus:ring-primary"
                                >
                                <div className="grid grid-cols-2 w-full divide-x-2">
                                    <div className="p-4 text-left hover:bg-muted/50 transition-colors">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Check-in</p>
                                        <p className="text-sm font-bold">{date?.from ? format(date.from, 'dd MMM yyyy') : 'Add date'}</p>
                                    </div>
                                    <div className="p-4 text-left hover:bg-muted/50 transition-colors">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Checkout</p>
                                        <p className="text-sm font-bold">{date?.to ? format(date.to, 'dd MMM yyyy') : 'Add date'}</p>
                                    </div>
                                </div>
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 shadow-2xl rounded-2xl border-none" align="center">
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
                                className="w-full justify-between text-left h-auto py-4 px-5 rounded-xl border-2 hover:border-primary transition-all"
                                >
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Travelers</p>
                                    <p className="text-sm font-bold">{guests} guest{guests !== 1 ? 's' : ''}</p>
                                </div>
                                <ChevronDown className="h-5 w-5 text-primary opacity-50"/>
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-5 rounded-xl shadow-xl border-muted">
                            <div className="flex items-center justify-between gap-8">
                                <div>
                                    <p className="font-black text-base">Guests</p>
                                    <p className="text-xs text-muted-foreground font-bold">Max capacity: {property.maxGuests}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-2" onClick={() => setGuests(g => Math.max(1, g - 1))} disabled={guests <= 1}>-</Button>
                                    <span className="w-4 text-center font-black text-lg">{guests}</span>
                                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-2" onClick={() => setGuests(g => Math.min(property.maxGuests, g + 1))} disabled={guests >= property.maxGuests}>+</Button>
                                </div>
                            </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button 
                        className="w-full bg-accent hover:bg-accent/90 text-white font-black py-7 text-xl rounded-xl shadow-lg shadow-accent/20 transition-all active:scale-[0.98]" 
                        size="lg" 
                        onClick={handleReservation} 
                        disabled={!date?.from || !date?.to || duration <= 0 || isBookingsLoading}
                    >
                        {isBookingsLoading ? <Loader2 className="animate-spin" /> : property.bookingSettings === 'instant' ? 'Reserve Now' : 'Request Stay'}
                    </Button>
                    <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {property.bookingSettings === 'instant' ? "Instant Confirmation" : "Host approval required"}
                    </p>

                    {duration > 0 && (
                        <div className="space-y-4 pt-6 border-t-2 border-dashed">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-muted-foreground underline underline-offset-4 decoration-muted">₦{dayPrice.toLocaleString()} x {duration} nights</span>
                                    <span className="font-bold">₦{subtotal.toLocaleString()}</span>
                                </div>
                                
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm font-bold text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            <span>{discountLabel}</span>
                                        </div>
                                        <span>-₦{discountAmount.toLocaleString()}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-muted-foreground underline underline-offset-4 decoration-muted">Cleaning fee</span>
                                    <span className="font-bold">₦{cleaningFee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-muted-foreground underline underline-offset-4 decoration-muted">StayNest fee</span>
                                    <span className="font-bold">₦{serviceFee.toLocaleString()}</span>
                                </div>
                            </div>
                            <Separator className="bg-muted/50" />
                            <div className="flex justify-between items-center pt-2">
                                <span className="font-black text-xl font-headline">Grand Total</span>
                                <span className="font-black text-2xl text-primary font-headline">₦{totalPrice.toLocaleString()}</span>
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
