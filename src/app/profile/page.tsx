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
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where } from 'firebase/firestore';
import PropertyCard from '@/components/property-card';
import type { Property } from '@/lib/types';


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'bookings');
  const firestore = useFirestore();
  
  const userListingsQuery = useMemoFirebase(
    () => (user && firestore) ? query(collection(firestore, 'listings'), where('ownerId', '==', user.uid)) : null,
    [user, firestore]
  );

  const { data: userProperties, isLoading: arePropertiesLoading } = useCollection<Property>(userListingsQuery);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-12 w-12" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Please log in to view your profile.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Log In</Link>
        </Button>
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
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="properties">My Properties</TabsTrigger>
            </TabsList>
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>My Bookings</CardTitle>
                  <CardDescription>
                    View your past and upcoming trips.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    You have no upcoming bookings.
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Start exploring to find your next adventure!
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="properties">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>My Properties</CardTitle>
                    <CardDescription>
                      Manage your listings and view guest requests.
                    </CardDescription>
                  </div>
                   <Button asChild>
                    <Link href="/properties/new">Create Listing</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {arePropertiesLoading && (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="animate-spin h-8 w-8" />
                    </div>
                  )}
                  {!arePropertiesLoading && userProperties && userProperties.length > 0 && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                        {userProperties.map((property) => (
                          <PropertyCard key={property.id} property={property} />
                        ))}
                      </div>
                  )}
                   {!arePropertiesLoading && (!userProperties || userProperties.length === 0) && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-semibold text-muted-foreground">
                        You have no properties listed.
                      </h3>
                       <p className="text-sm text-muted-foreground">
                        Click "Create Listing" to get started.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
