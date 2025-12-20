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
  Sparkles
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDoc, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError, useCollection } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp, Timestamp, deleteDoc, setDoc, getDoc, query, orderBy, writeBatch } from "firebase/firestore";
import type { Property, Review } from "@/lib/types";
import { DateRange } from "react-day-picker";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { propertyTypes, guestSpaces, whoElseOptions, amenitiesList } from "@/lib/types";

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
  const guestSpaceLabel = guestSpaces.find(g => g.id === property.guestSpace)?.label.toLowerCase() || 'space';

  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-semibold">
          {propertyTypeLabel} hosted by {hostName}
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
      <Avatar className="h-16 w-16">
        {hostAvatarUrl && <AvatarImage src={hostAvatarUrl} alt={hostName} />}
        <AvatarFallback className="text-2xl">{hostAvatarFallback}</AvatarFallback>
      </Avatar>
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
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: reviewColRef.path,
            operation: 'create',
            requestResourceData: reviewData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "Error submitting review." });
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

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
                        <Label>Rating</Label>
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
                        <Label htmlFor="comment">Comment</Label>
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

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 5),
  });
  const [guests, setGuests] = React.useState(2);
  const [isReserving, setIsReserving] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);

  const userFavoritesQuery = useMemoFirebase(
    () => (user && property) ? collection(firestore, `users/${user.uid}/favorites`) : null,
    [user, firestore, property]
  );
  const { data: favorites } = useCollection(userFavoritesQuery);
  const isFavorited = React.useMemo(() => favorites?.some(fav => fav.id === property.id), [favorites, property]);

  const duration = date?.from && date?.to ? differenceInCalendarDays(date.to, date.from) : 0;
  
  const subtotal = property.pricePerNight * duration;
  const cleaningFee = property?.cleaningFee || 0;
  const serviceFee = property?.serviceFee || 0;
  const totalPrice = subtotal + cleaningFee + serviceFee;

  const handleFavoriteToggle = async () => {
    if (!user || !property) {
      toast({
        variant: "destructive",
        title: "Please log in",
        description: "You need to be logged in to favorite a listing.",
      });
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
    } catch (error) {
       const permissionError = new FirestorePermissionError({
          path: favoriteRef.path,
          operation: isFavorited ? 'delete' : 'create',
        });
        errorEmitter.emit('permission-error', permissionError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    }
  };

  const handleReservation = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to reserve a property.",
      });
      router.push('/login');
      return;
    }

    if (!property || !date?.from || !date?.to || !duration) {
      toast({
        variant: "destructive",
        title: "Reservation Error",
        description: "Please select valid dates for your stay.",
      });
      return;
    }

    setIsReserving(true);

    const bookingData = {
      guestId: user.uid,
      hostId: property.ownerId,
      listingId: property.id,
      checkInDate: Timestamp.fromDate(date.from),
      checkOutDate: Timestamp.fromDate(date.to),
      guests,
      totalPrice,
      status: 'pending' as const,
      createdAt: serverTimestamp(),
      listing: {
        id: property.id,
        title: property.title,
        location: property.location,
        imageUrl: property.imageUrl,
      },
    };

    const bookingsColRef = collection(firestore, 'bookings');
    
    addDoc(bookingsColRef, bookingData)
      .then(() => {
        toast({
          title: "Reservation Submitted!",
          description: "Your request has been sent to the host for approval.",
        });
        router.push('/profile?tab=bookings');
      })
      .catch((error: any) => {
        const permissionError = new FirestorePermissionError({
          path: bookingsColRef.path,
          operation: 'create',
          requestResourceData: bookingData,
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "Could not submit your reservation. Please try again.",
        });
      })
      .finally(() => {
        setIsReserving(false);
      });
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
    return <p className="flex items-center gap-2"><Users2 /> You may be sharing the space with: {who}</p>;
  };

  return (
    <div className="container mx-auto py-8 lg:py-12">
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-start">
            <h1 className="text-3xl lg:text-4xl font-bold font-headline">
            {property.title}
            </h1>
            <Button variant="outline" onClick={handleFavoriteToggle}>
              <Heart className={`mr-2 h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
              {isFavorited ? 'Favorited' : 'Favorite'}
            </Button>
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
              <p className="flex items-center gap-2"><Home /> {guestSpaceLabel}</p>
              <WhoElseDisplay />
          </div>

          <div className="border-b pb-6">
            <p className="text-foreground/90">{property.description}</p>
          </div>

          <div className="border-b pb-6">
            <h3 className="text-xl font-semibold mb-4">What this place offers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {property.amenities && property.amenities.map((amenity) => {
                const Icon = amenityIcons[amenity] || Plus;
                return (
                  <div key={amenity} className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
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
          <Card className="sticky top-24 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-baseline">
                <span className="text-2xl font-bold">${property.pricePerNight}</span>
                <span className="ml-1 text-base font-normal text-muted-foreground">/ night</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TooltipProvider>
                <Calendar
                  mode="range"
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={1}
                  className="p-0 [&_td]:w-auto [&_td]:p-1 [&_th]:w-auto"
                  disabled={{ before: new Date() }}
                  footer={
                    <div className="text-sm text-muted-foreground pt-2 flex justify-between">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-semibold">Selected: {duration} night{duration !== 1 ? 's' : ''}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Check-in: {date?.from ? format(date.from, 'PPP') : 'N/A'}</p>
                          <p>Check-out: {date?.to ? format(date.to, 'PPP') : 'N/A'}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Button variant="link" className="p-0 h-auto" onClick={() => setDate(undefined)}>Clear</Button>
                    </div>
                  }
                />
              </TooltipProvider>
               <div className="grid gap-2">
                 <Label htmlFor="guests">Guests</Label>
                 <Input 
                   id="guests" 
                   type="number" 
                   value={guests} 
                   onChange={(e) => setGuests(Number(e.target.value))} 
                   min={1} 
                   max={property.maxGuests} 
                  />
               </div>
              <Button className="w-full" size="lg" onClick={handleReservation} disabled={isReserving}>
                {isReserving ? <Loader2 className="animate-spin" /> : 'Reserve'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">You won't be charged yet</p>
              {duration > 0 && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>${property.pricePerNight} x {duration} nights</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span>${cleaningFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service fee</span>
                    <span>${serviceFee.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
