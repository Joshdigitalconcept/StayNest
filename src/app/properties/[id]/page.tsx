import Image from "next/image";
import { notFound } from "next/navigation";
import {
  findPropertyById,
  findUserById,
  findReviewsByPropertyId,
  findImageById,
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
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const amenityIcons: { [key: string]: React.ElementType } = {
  Wifi,
  Kitchen: Soup,
  "Free parking": ParkingCircle,
  Heating: Wind,
  TV: Tv,
  "Air conditioning": Wind,
  Pool: Plus, // Placeholder
  Elevator: Plus,
  Gym: Plus,
};

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const property = findPropertyById(params.id);
  if (!property) {
    notFound();
  }

  const host = findUserById(property.hostId);
  const reviews = findReviewsByPropertyId(property.id);
  const image = findImageById(property.imageId);
  const hostAvatar = findImageById(host?.avatarId || "");

  return (
    <div className="container mx-auto py-8 lg:py-12">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold font-headline">
          {property.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-semibold text-foreground">{property.rating.toFixed(1)}</span>
            <span className="underline">({reviews.length} reviews)</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{property.location}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[300px] md:h-[500px] rounded-lg overflow-hidden mb-8">
        {image && (
          <Image
            src={image.imageUrl}
            alt={property.title}
            fill
            className="object-cover"
            priority
            data-ai-hint={image.imageHint}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="border-b pb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">
                  Entire place hosted by {host?.name}
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
                {hostAvatar && <AvatarImage src={hostAvatar.imageUrl} alt={host?.name} />}
                <AvatarFallback>{host?.name?.charAt(0)}</AvatarFallback>
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
              <span>{property.rating.toFixed(1)} ({reviews.length} reviews)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {reviews.map((review) => {
                const user = findUserById(review.userId);
                const userAvatar = findImageById(user?.avatarId || "");
                return (
                  <div key={review.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                         {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt={user?.name} />}
                        <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user?.name}</p>
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
                );
              })}
            </div>
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
                className="rounded-md border"
              />
               <div className="grid gap-2">
                 <Label htmlFor="guests">Guests</Label>
                 <Input id="guests" type="number" defaultValue={2} min={1} max={property.maxGuests} />
               </div>
              <Button className="w-full" size="lg">Reserve</Button>
              <p className="text-center text-sm text-muted-foreground">You won't be charged yet</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>${property.pricePerNight} x 5 nights</span>
                  <span>${property.pricePerNight * 5}</span>
                </div>
                 <div className="flex justify-between">
                  <span>Cleaning fee</span>
                  <span>$50</span>
                </div>
                <div className="flex justify-between">
                  <span>Service fee</span>
                  <span>$75</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${property.pricePerNight * 5 + 50 + 75}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
