
'use client';

import { useParams, notFound } from 'next/navigation';
import * as React from 'react';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, getDoc } from 'firebase/firestore';
import type { User, Property } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Briefcase, Languages, Home } from 'lucide-react';
import PropertyCard from '@/components/property-card';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1200;

function LoadingSpinner() {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="animate-spin h-12 w-12" />
        </div>
    );
}

function ProfileContent({ user, listings }: { user: User; listings: Property[] | null }) {
    const profileDetails = [
      { title: "About", value: user.about, icon: <Briefcase /> },
      { title: "Languages", value: user.languages, icon: <Languages /> },
      { title: "Location", value: user.live, icon: <Home /> },
    ];

    return (
        <div className="container mx-auto py-12">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader className="items-center text-center">
                            <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage src={user.profilePictureUrl} alt={`${user.firstName}'s avatar`} />
                                <AvatarFallback className="text-3xl">{user.firstName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-2xl">{user.firstName}</CardTitle>
                            <CardDescription>Host</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {profileDetails.map(detail => (
                                detail.value && (
                                    <div key={detail.title} className="flex items-start gap-3">
                                        <div className="text-muted-foreground mt-1">{detail.icon}</div>
                                        <div>
                                            <h4 className="font-semibold">{detail.title}</h4>
                                            <p className="text-sm text-muted-foreground">{detail.value}</p>
                                        </div>
                                    </div>
                                )
                           ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-3">
                    <h2 className="text-2xl font-bold mb-6">Listings by {user.firstName}</h2>
                    {listings && listings.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                            {listings.map(property => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg">
                            <h3 className="text-xl font-semibold text-muted-foreground">{user.firstName} has no active listings.</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Check back later to see their properties.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UserProfilePage() {
    const params = useParams();
    const id = params.id as string;
    const firestore = useFirestore();
    const [retryCount, setRetryCount] = React.useState(0);

    const userDocRef = useMemoFirebase(
        () => (firestore && id) ? doc(firestore, 'users', id) : null,
        [firestore, id]
    );
    const { data: user, isLoading: isUserLoading, error: userError } = useDoc<User>(userDocRef);
    
    const userListingsQuery = useMemoFirebase(
      () => (firestore && id) ? query(collection(firestore, 'listings'), where('ownerId', '==', id)) : null,
      [firestore, id]
    );
    const { data: listings, isLoading: areListingsLoading } = useCollection<Property>(userListingsQuery);

    React.useEffect(() => {
        if (!isUserLoading && !user && !userError && retryCount < MAX_RETRIES) {
          const timer = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            // This is a bit of a hack to force the hook to re-check
            const recheck = async () => {
              if (userDocRef) {
                await getDoc(userDocRef);
              }
            };
            recheck();
          }, RETRY_DELAY_MS);
          
          return () => clearTimeout(timer);
        }
    }, [isUserLoading, user, userError, retryCount, userDocRef]);
    
    const isLoading = isUserLoading || areListingsLoading;

    if (isLoading && retryCount === 0) {
        return <LoadingSpinner />;
    }

    if (!isLoading && !user && retryCount >= MAX_RETRIES) {
        notFound();
    }

    if (!user) {
        return <LoadingSpinner />;
    }

    return <ProfileContent user={user} listings={listings} />;
}
