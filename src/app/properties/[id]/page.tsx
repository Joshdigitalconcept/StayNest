'use client';

import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import * as React from 'react';
import {
  findReviewsByPropertyId,
} from "@/lib/placeholder-data";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDoc, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError, useCollection } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp, Timestamp, query, where } from "firebase/firestore";
import type { Property } from "@/lib/types";
import { DateRange } from "react-day-picker";
import { addDays, differenceInCalendarDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const amenityIcons: { [key: string]: React.ElementType } = {
  Wifi,
  Kitchen: Soup,
  "Free parking": ParkingCircle,
  Heating: Wind,
  TV: Tv,
  "Air conditioning": Wind,
  Pool: Plus,
  Elevator: Plus, 
  Gym: Plus,
};

export default function PropertyPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const propertyRef = useMemoFirebase(
    () => (firestore && id) ? doc(firestore, "listings", id) : null,
    [firestore, id]
  );
  
  const { data: property, isLoading } = useDoc<Property>(propertyRef);

  const hostQuery = useMemoFirebase(
    () => (firestore && property) ? doc(firestore, "users", property.ownerId) : null,
    [firestore, property]
  );
  const { data: host } = useDoc(hostQuery);

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 5),
  });
  const [guests, setGuests] = React.useState(2);
  const [isReserving, setIsReserving] = React.useState(false);

  const duration = date?.from && date?.to ? differenceInCalendarDays(date.to, date.from) : 0;
  const subtotal = property ? property.pricePerNight * duration : 0;
  const cleaningFee = property?.cleaningFee || 0;
  const serviceFee = property?.serviceFee || 0;
  const totalPrice = subtotal + cleaningFee + serviceFee;

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

  const reviews = findReviewsByPropertyId(id);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-12 w-12" />
      </div>
    );
  }

  if (!property) {
    notFound();
  }

  const images = property.imageUrls || [property.imageUrl];
  const reviewCount = reviews.length;
  const rating = property.rating || 0;
  const ratingDisplay = reviewCount > 0 ? `${rating.toFixed(1)} (${reviewCount} reviews)` : 'New listing';


  return (
    <div className="container mx-auto py-8 lg:py-12">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold font-headline">
          {property.title}
        </h1>
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

       <Carousel className="w-full mb-8">
        <CarouselContent>
          {images.map((url, index) => (
            <CarouselItem key={index} className="relative aspect-video">
               <Image
                src={url}
                alt={`${property.title} image ${index + 1}`}
                fill
                className="object-cover rounded-lg"
                priority={index === 0}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
      </Carousel>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="border-b pb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">
                  Entire place hosted by {host?.firstName || 'Host'}
                </h2>
                <div className="flex items-center gap-4 text-muted-foreground mt-1">
                  <span>{property.maxGuests} guests</span>
                  <span>&middot;</span>
                  <span>{property.bedrooms} bedrooms</span>
                  <span>&middot;</span>
                  <span>{property.bathrooms} bathrooms</span>
                </div>
              </div>
              <Avatar className="h-16 w-16">
                {host?.profilePictureUrl && <AvatarImage src={host.profilePictureUrl} alt={host.firstName} />}
                <AvatarFallback>{host?.firstName?.charAt(0) || 'H'}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="border-b pb-6">
            <p className="text-foreground/90">{property.description}</p>
          </div>

          <div className="border-b pb-6">
            <h3 className="text-xl font-semibold mb-4">What this place offers</h3>
            <div className="grid grid-cols-2 gap-4">
              {property.amenities.map((amenity) => {
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

          <div>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Star className="w-5 h-5" />
               <span>{ratingDisplay}</span>
            </h3>
            {reviewCount > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {reviews.map((review) => (
                    <div key={review.id} className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                           <AvatarFallback>{review.userId.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{review.userId}</p>
                          <p className="text-sm text-muted-foreground">{new Date(review.date).toLocaleDateString("en-US", { year: 'numeric', month: 'long' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="text-foreground/90">{review.comment}</p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Be the first to review this listing!</p>
            )}
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
              <Calendar
                mode="range"
                selected={date}
                onSelect={setDate}
                numberOfMonths={1}
                className="rounded-md border"
                disabled={{ before: new Date() }}
              />
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
