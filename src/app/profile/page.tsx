
'use client';

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
import { Edit, Loader2, BookOpen, Briefcase, GraduationCap, Home, Languages, Map, Plane, Smile, Star, Users, Music, Clock, PawPrint } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError, useDoc } from '@/firebase';
import { useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import PropertyCard from '@/components/property-card';
import type { Property, Booking, User as UserType } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const badgeVariants: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
  pending: 'secondary',
  confirmed: 'default',
  declined: 'destructive',
};

const ProfileSection = ({ title, value, onEdit, icon }: { title: string, value?: string, onEdit: () => void, icon: ReactNode }) => (
  <div>
    <h3 className="text-lg font-semibold">{title}</h3>
    {value ? (
      <p className="text-muted-foreground">{value}</p>
    ) : (
      <div className="flex items-center justify-between mt-1">
        <p className="text-sm text-muted-foreground">Tell us about yourself.</p>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" /> Add
        </Button>
      </div>
    )}
  </div>
);


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  
  const userDocRef = useMemoFirebase(
    () => (user && firestore) ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserType>(userDocRef);
  
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
  
  const handleEditRedirect = () => {
    router.push('/profile/edit');
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
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                {userProfile.profilePictureUrl && <AvatarImage src={userProfile.profilePictureUrl} alt="User Avatar" />}
                <AvatarFallback className="text-3xl">{userProfile.firstName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{userProfile.firstName} {userProfile.lastName}</CardTitle>
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
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full h-auto grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="properties">My Properties</TabsTrigger>
              <TabsTrigger value="reservations">Reservations</TabsTrigger>
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
                  <Button onClick={handleEditRedirect}>Edit details</Button>
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
                  {areBookingsLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div> :
                    myBookings && myBookings.length > 0 ? (
                      <div className="space-y-4">
                        {myBookings.map(booking => (
                           <Link key={booking.id} href={`/properties/${booking.listing?.id || booking.listingId}`}>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border p-4 rounded-lg hover:bg-muted/50">
                                <Image src={booking.listing?.imageUrl || ''} alt={booking.listing?.title || ''} width={128} height={128} className="rounded-md object-cover h-32 w-full sm:w-32"/>
                                <div className="flex-1">
                                  <h3 className="font-semibold">{booking.listing?.title}</h3>
                                  <p className="text-sm text-muted-foreground">{booking.listing?.location}</p>
                                  <p className="text-sm mt-1">{booking.checkInDate ? format(booking.checkInDate.toDate(), 'PPP') : ''} - {booking.checkOutDate ? format(booking.checkOutDate.toDate(), 'PPP') : ''}</p>
                                </div>
                                <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
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
                    <CardDescription>Approve or decline requests from guests for your properties.</CardDescription>
                </CardHeader>
                <CardContent>
                    {areReservationsLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div> :
                    hostReservations && hostReservations.length > 0 ? (
                        <div className="space-y-4">
                        {hostReservations.map(booking => (
                            <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border p-4 rounded-lg">
                                <Image src={booking.listing?.imageUrl || ''} alt={booking.listing?.title || ''} width={128} height={128} className="rounded-md object-cover h-32 w-full sm:w-32"/>
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-semibold">{booking.listing?.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                    {booking.checkInDate ? format(booking.checkInDate.toDate(), 'PPP') : ''} - {booking.checkOutDate ? format(booking.checkOutDate.toDate(), 'PPP') : ''}
                                    </p>
                                    <p className="text-sm">Total: <span className="font-bold">${booking.totalPrice}</span></p>
                                </div>
                                <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                {booking.status === 'pending' ? (
                                    <>
                                    <Button size="sm" onClick={() => handleBookingStatusUpdate(booking.id, 'confirmed')}>Approve</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleBookingStatusUpdate(booking.id, 'declined')}>Decline</Button>
                                    </>
                                ) : (
                                    <Badge variant={badgeVariants[booking.status]} className="self-center sm:self-end">{booking.status}</Badge>
                                )}
                                </div>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                        <h3 className="text-lg font-semibold text-muted-foreground">No pending reservations.</h3>
                        <p className="text-sm text-muted-foreground">You will be notified when a guest requests to book one of your properties.</p>
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

    

