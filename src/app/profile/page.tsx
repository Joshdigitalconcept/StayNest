'use client';

import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Loader2 } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import PropertyCard from '@/components/property-card';
import type { Property, Booking } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const badgeVariants: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
  pending: 'secondary',
  confirmed: 'default',
  declined: 'destructive',
};

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'bookings');
  
  // Queries
  const userListingsQuery = useMemoFirebase(
    () => (user && firestore) ? query(collection(firestore, 'listings'), where('ownerId', '==', user.uid)) : null,
    [user, firestore]
  );
  
  const guestBookingsQuery = useMemoFirebase(
    () => (user && firestore) ? query(collection(firestore, 'bookings'), where('guestId', '==', user.uid)) : null,
    [user, firestore]
  );

  const hostReservationsQuery = useMemoFirebase(
    () => (user && firestore) ? query(collection(firestore, 'bookings'), where('hostId', '==', user.uid)) : null,
    [user, firestore]
  );

  // Data fetching
  const { data: userProperties, isLoading: arePropertiesLoading } = useCollection<Property>(userListingsQuery);
  const { data: myBookings, isLoading: areBookingsLoading } = useCollection<Booking>(guestBookingsQuery);
  const { data: hostReservations, isLoading: areReservationsLoading } = useCollection<Booking>(hostReservationsQuery);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleBookingStatusUpdate = (bookingId: string, status: 'confirmed' | 'declined') => {
    if (!firestore) return;
    const bookingRef = doc(firestore, 'bookings', bookingId);
    updateDoc(bookingRef, { status })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: bookingRef.path,
          operation: 'update',
          requestResourceData: { status },
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (isUserLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Please log in to view your profile.</p>
        <Button asChild className="mt-4"><Link href="/login">Log In</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                {user.photoURL && <AvatarImage src={user.photoURL} alt="User Avatar" />}
                <AvatarFallback className="text-3xl">{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{user.displayName}</CardTitle>
              <CardDescription>Joined in {user.metadata.creationTime ? new Date(user.metadata.creationTime).getFullYear() : ''}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
               <Button variant="outline" asChild>
                <Link href="/profile/edit">
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="properties">My Properties</TabsTrigger>
              <TabsTrigger value="reservations">Reservations</TabsTrigger>
            </TabsList>
            
            {/* My Bookings (Guest) */}
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>My Bookings</CardTitle>
                  <CardDescription>View your past and upcoming trips.</CardDescription>
                </CardHeader>
                <CardContent>
                  {areBookingsLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div> :
                    myBookings && myBookings.length > 0 ? (
                      <div className="space-y-4">
                        {myBookings.map(booking => (
                           <Link key={booking.id} href={`/properties/${booking.listing?.id || booking.listingId}`}>
                            <div className="flex items-center gap-4 border p-4 rounded-lg hover:bg-muted/50">
                                <Image src={booking.listing?.imageUrl || ''} alt={booking.listing?.title || ''} width={128} height={128} className="rounded-md object-cover h-32 w-32"/>
                                <div className="flex-1">
                                  <h3 className="font-semibold">{booking.listing?.title}</h3>
                                  <p className="text-sm text-muted-foreground">{booking.listing?.location}</p>
                                  <p className="text-sm mt-1">{format(booking.checkInDate.toDate(), 'PPP')} - {format(booking.checkOutDate.toDate(), 'PPP')}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Badge variant={badgeVariants[booking.status]}>{booking.status}</Badge>
                                  <span className="font-semibold">${booking.totalPrice}</span>
                                </div>
                              </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <h3 className="text-lg font-semibold text-muted-foreground">You have no upcoming bookings.</h3>
                        <p className="text-sm text-muted-foreground">Start exploring to find your next adventure!</p>
                      </div>
                    )
                  }
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* My Properties (Host) */}
            <TabsContent value="properties">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>My Properties</CardTitle>
                    <CardDescription>Manage your listings and view guest requests.</CardDescription>
                  </div>
                  <Button asChild><Link href="/properties/new">Create Listing</Link></Button>
                </CardHeader>
                <CardContent>
                  {arePropertiesLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div> :
                    userProperties && userProperties.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                        {userProperties.map((property) => <PropertyCard key={property.id} property={property} />)}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <h3 className="text-lg font-semibold text-muted-foreground">You have no properties listed.</h3>
                        <p className="text-sm text-muted-foreground">Click "Create Listing" to get started.</p>
                      </div>
                    )
                  }
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reservations for my Properties (Host) */}
            <TabsContent value="reservations">
               <Card>
                <CardHeader>
                  <CardTitle>Guest Reservations</CardTitle>
                  <CardDescription>Manage booking requests for your properties.</CardDescription>
                </CardHeader>
                <CardContent>
                   {areReservationsLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div> :
                    hostReservations && hostReservations.length > 0 ? (
                       <div className="space-y-4">
                        {hostReservations.map(booking => (
                          <div key={booking.id} className="flex items-center gap-4 border p-4 rounded-lg">
                            <Link href={`/properties/${booking.listing?.id || booking.listingId}`}>
                                <Image src={booking.listing?.imageUrl || ''} alt={booking.listing?.title || ''} width={128} height={128} className="rounded-md object-cover h-32 w-32"/>
                            </Link>
                            <div className="flex-1">
                              <h3 className="font-semibold">{booking.listing?.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {format(booking.checkInDate.toDate(), 'PPP')} - {format(booking.checkOutDate.toDate(), 'PPP')}
                              </p>
                              <p className="text-sm mt-1">{booking.guests} guest(s) - ${booking.totalPrice}</p>
                            </div>
                            {booking.status === 'pending' ? (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleBookingStatusUpdate(booking.id, 'confirmed')}>Approve</Button>
                                <Button size="sm" variant="outline" onClick={() => handleBookingStatusUpdate(booking.id, 'declined')}>Decline</Button>
                              </div>
                            ) : (
                              <Badge variant={badgeVariants[booking.status]}>{booking.status}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <h3 className="text-lg font-semibold text-muted-foreground">You have no pending reservations.</h3>
                      </div>
                    )
                  }
                </CardContent>
               </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}
