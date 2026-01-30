'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { Edit, Loader2, BookOpen, Briefcase, GraduationCap, Home, Languages, Map, Plane, Smile, Star, Users, Music, Clock, PawPrint, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, doc, updateDoc, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import PropertyCard from '@/components/property-card';
import type { Property, Booking, User as UserType } from '@/lib/types';
import { format, areIntervalsOverlapping } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

const badgeVariants: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
  pending: 'secondary',
  confirmed: 'default',
  declined: 'destructive',
};

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  
  const userDocRef = useMemoFirebase(
    () => (user && firestore) ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserType>(userDocRef);
  
  // Queries for current user data
  const userListingsQuery = useMemoFirebase(
    () => (user && firestore) ? query(collection(firestore, 'listings'), where('ownerId', '==', user.uid)) : null,
    [user, firestore]
  );
  
  const guestBookingsQuery = useMemoFirebase(
    () => (user && firestore) ? query(collection(firestore, 'bookings'), where('guestId', '==', user.uid), orderBy('createdAt', 'desc')) : null,
    [user, firestore]
  );

  const hostReservationsQuery = useMemoFirebase(
    () => (user && firestore) ? query(collection(firestore, 'bookings'), where('hostId', '==', user.uid), orderBy('createdAt', 'desc')) : null,
    [user, firestore]
  );

  const { data: userProperties, isLoading: arePropertiesLoading } = useCollection<Property>(userListingsQuery);
  const { data: myBookings, isLoading: areMyBookingsLoading } = useCollection<Booking>(guestBookingsQuery);
  const { data: hostReservations, isLoading: areHostReservationsLoading } = useCollection<Booking>(hostReservationsQuery);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const totalEarnings = React.useMemo(() => {
    if (!hostReservations) return 0;
    return hostReservations
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  }, [hostReservations]);

  const sendAutomatedMessage = async (booking: Booking, customText: string) => {
    if (!firestore || !user) return;
    const messagesColRef = collection(firestore, `bookings/${booking.id}/messages`);
    const messageData = {
      bookingId: booking.id,
      senderId: user.uid,
      receiverId: booking.guestId,
      listingId: booking.listingId,
      guestId: booking.guestId,
      hostId: booking.hostId,
      text: customText,
      createdAt: serverTimestamp(),
      isRead: false,
    };
    try {
      await addDoc(messagesColRef, messageData);
    } catch (error) {
      console.error("Failed to send automated message:", error);
    }
  };


 const handleBookingStatusUpdate = async (bookingToUpdate: Booking, status: 'confirmed' | 'declined') => {
    if (!firestore || !user) return;
    const bookingRef = doc(firestore, 'bookings', bookingToUpdate.id);
    const listingName = bookingToUpdate.listing?.title || 'the property';
    const requestedDates = `${format(bookingToUpdate.checkInDate.toDate(), 'MMM d, yyyy')} to ${format(bookingToUpdate.checkOutDate.toDate(), 'MMM d, yyyy')}`;

    if (status === 'confirmed') {
      const confirmedBookingsQuery = query(
        collection(firestore, 'bookings'),
        where('listingId', '==', bookingToUpdate.listingId),
        where('status', '==', 'confirmed')
      );

      try {
        const confirmedSnaps = await getDocs(confirmedBookingsQuery);
        const conflictingBookingDoc = confirmedSnaps.docs.find(docSnap => {
          const existingBooking = docSnap.data() as Booking;
          return areIntervalsOverlapping(
            { start: bookingToUpdate.checkInDate.toDate(), end: bookingToUpdate.checkOutDate.toDate() },
            { start: existingBooking.checkInDate.toDate(), end: existingBooking.checkOutDate.toDate() },
            { inclusive: false }
          );
        });
        
        if (conflictingBookingDoc) {
          const conflictingBooking = conflictingBookingDoc.data() as Booking;
          await updateDoc(bookingRef, { status: 'declined' });
          
          const conflictingDates = `${format(conflictingBooking.checkInDate.toDate(), 'MMM d, yyyy')} to ${format(conflictingBooking.checkOutDate.toDate(), 'MMM d, yyyy')}`;
          const automatedMessage = `Hello, thank you for your booking request for "${listingName}" from ${requestedDates}. Unfortunately, these dates could not be confirmed because they conflict with an existing reservation for ${conflictingDates}. Please feel free to select other dates.`;
          await sendAutomatedMessage(bookingToUpdate, automatedMessage);

          toast({
            variant: "destructive",
            title: "Date Conflict",
            description: "This request conflicts with a confirmed booking and has been automatically declined.",
          });
          return;
        }
        
        await updateDoc(bookingRef, { status });
        const confirmationMessage = `Great news! Your booking for "${listingName}" from ${requestedDates} has been confirmed. I look forward to hosting you!`;
        await sendAutomatedMessage(bookingToUpdate, confirmationMessage);
        toast({ title: "Booking Confirmed", description: "The guest has been notified." });

      } catch (error) {
        console.error("Error checking for booking conflicts:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not check for booking conflicts."});
        return;
      }
    } else {
        await updateDoc(bookingRef, { status });
        const declineMessage = `Hi there, unfortunately I'm unable to accept your request to book "${listingName}" from ${requestedDates} at this time. I hope you can find another suitable stay.`;
        await sendAutomatedMessage(bookingToUpdate, declineMessage);
        toast({ title: "Booking Declined", description: "The guest has been notified." });
    }
  };
  
  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>;
  }

  if (!user || !userProfile) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Please log in to view your profile.</p>
        <Button asChild className="mt-4"><Link href="/login">Log In</Link></Button>
      </div>
    );
  }
  
  const profileDetails = [
    { title: "My work", value: userProfile.work, icon: <Briefcase /> },
    { title: "Where I live", value: userProfile.live, icon: <Home /> },
    { title: "Languages I speak", value: userProfile.languages, icon: <Languages /> },
    { title: "Where I went to school", value: userProfile.school, icon: <GraduationCap /> },
    { title: "Decade I was born", value: userProfile.born, icon: <Users /> },
    { title: "My biography title would be", value: userProfile.biographyTitle, icon: <BookOpen /> },
    { title: "I'm obsessed with", value: userProfile.obsessedWith, icon: <Star /> },
    { title: "My fun fact", value: userProfile.funFact, icon: <Smile /> },
    { title: "My most useless skill", value: userProfile.uselessSkill, icon: <Plane /> },
    { title: "My favorite song in high school", value: userProfile.favoriteSong, icon: <Music /> },
    { title: "I spend too much time", value: userProfile.spendTooMuchTime, icon: <Clock /> },
    { title: "My pets", value: userProfile.pets, icon: <PawPrint /> },
    { title: "Where I've always wanted to go", value: userProfile.travelGoal, icon: <Map /> },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="space-y-6">
            <Card>
              <CardHeader className="items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  {userProfile.profilePictureUrl && <AvatarImage src={userProfile.profilePictureUrl} alt="User Avatar" />}
                  <AvatarFallback className="text-3xl">{userProfile.firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{userProfile.firstName} {userProfile.lastName}</CardTitle>
                <CardDescription>Joined in {user.metadata.creationTime ? new Date(user.metadata.creationTime).getFullYear() : ''}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <Button variant="outline" className="w-full" asChild>
                  <Link href="/profile/edit">
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {userProfile.isHost && (
              <Card className="bg-primary/10 border-primary/20 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Wallet className="h-5 w-5" />
                    <span className="text-sm uppercase tracking-wider">Host Dashboard</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Total Payouts Confirmed</p>
                    <p className="text-3xl font-black text-primary">₦{totalEarnings.toLocaleString()}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-primary/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Properties</span>
                      <span className="font-bold">{userProperties?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-2">
                      <span className="text-muted-foreground">Confirmed Stays</span>
                      <span className="font-bold">{hostReservations?.filter(r => r.status === 'confirmed').length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full h-auto grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="properties">My Properties</TabsTrigger>
              <TabsTrigger value="reservations" className="relative">
                Reservations
                {hostReservations && hostReservations.filter(r => r.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {hostReservations.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>About {userProfile.firstName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userProfile.about && <p className="text-muted-foreground italic">"{userProfile.about}"</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profileDetails.map(detail => (
                      <div key={detail.title} className="flex items-start gap-4">
                        <div className="text-muted-foreground mt-1 w-6 h-6 flex-shrink-0">{detail.icon}</div>
                        <div className="flex-grow">
                          <h4 className="font-semibold">{detail.title}</h4>
                          <p className="text-sm text-muted-foreground">{detail.value || `You haven't added this yet.`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button asChild><Link href="/profile/edit">Edit details</Link></Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>My Bookings</CardTitle>
                  <CardDescription>View your past and upcoming trips.</CardDescription>
                </CardHeader>
                <CardContent>
                  {areMyBookingsLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div> :
                    myBookings && myBookings.length > 0 ? (
                      <div className="space-y-4">
                        {myBookings.map(booking => (
                           <Link key={booking.id} href={`/properties/${booking.listingId}`}>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border p-4 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="relative h-32 w-full sm:w-32 rounded-md overflow-hidden bg-muted">
                                  {booking.listing?.imageUrl && <Image src={booking.listing.imageUrl} alt="" fill className="object-cover"/>}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold">{booking.listing?.title || 'Trip'}</h3>
                                  <p className="text-sm text-muted-foreground">{booking.listing?.location}</p>
                                  <p className="text-sm mt-1">{booking.checkInDate ? format(booking.checkInDate.toDate(), 'PPP') : ''} - {booking.checkOutDate ? format(booking.checkOutDate.toDate(), 'PPP') : ''}</p>
                                </div>
                                <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                  <Badge variant={badgeVariants[booking.status]}>{booking.status}</Badge>
                                  <span className="font-bold text-lg text-primary">₦{booking.totalPrice?.toLocaleString()}</span>
                                  {booking.status === 'confirmed' && <p className="text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> RESERVED & PAID</p>}
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
            
            <TabsContent value="properties">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>My Properties</CardTitle>
                    <CardDescription>Manage your listings and view guest requests.</CardDescription>
                  </div>
                  <Button asChild><Link href="/host/create">Create Listing</Link></Button>
                </CardHeader>
                <CardContent>
                  {arePropertiesLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div> :
                    userProperties && userProperties.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                        {userProperties.map((property) => <PropertyCard key={property.id} property={property} showAdminControls={true} />)}
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
            
            <TabsContent value="reservations">
                <Card>
                <CardHeader>
                    <CardTitle>Guest Reservations</CardTitle>
                    <CardDescription>Review and manage booking requests from potential guests.</CardDescription>
                </CardHeader>
                <CardContent>
                    {areHostReservationsLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div> :
                    hostReservations && hostReservations.length > 0 ? (
                        <div className="space-y-4">
                        {hostReservations.map(booking => (
                            <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border p-4 rounded-lg bg-background shadow-sm">
                                <div className="relative h-32 w-full sm:w-32 rounded-md overflow-hidden bg-muted">
                                  {booking.listing?.imageUrl && <Image src={booking.listing.imageUrl} alt="" fill className="object-cover"/>}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h3 className="font-semibold text-lg">{booking.listing?.title || 'Booking'}</h3>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={booking.guest?.photoURL} />
                                            <AvatarFallback>{booking.guest?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-semibold">{booking.guest?.name || 'Guest'}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">
                                    {booking.checkInDate ? format(booking.checkInDate.toDate(), 'PPP') : ''} - {booking.checkOutDate ? format(booking.checkOutDate.toDate(), 'PPP') : ''}
                                    </p>
                                    <p className="text-sm">Payout: <span className="font-bold text-primary">₦{booking.totalPrice?.toLocaleString()}</span></p>
                                </div>
                                <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                {booking.status === 'pending' ? (
                                    <>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleBookingStatusUpdate(booking, 'confirmed')}>
                                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleBookingStatusUpdate(booking, 'declined')}>
                                      <XCircle className="mr-2 h-4 w-4" /> Decline
                                    </Button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge variant={badgeVariants[booking.status]}>{booking.status}</Badge>
                                        {booking.status === 'confirmed' && (
                                            <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 bg-green-100 px-2 py-1 rounded">
                                                <Wallet className="h-3 w-3" /> REVENUE CONFIRMED
                                            </p>
                                        )}
                                    </div>
                                )}
                                </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <h3 className="text-lg font-semibold text-muted-foreground">No reservations yet.</h3>
                        <p className="text-sm text-muted-foreground">When guests book your places, they'll appear here for your review.</p>
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
