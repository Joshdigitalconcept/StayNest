'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, getDocs, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PropertyCard from '@/components/property-card';
import type { Property, Favorite } from '@/lib/types';

export default function FavoritesPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [favoriteProperties, setFavoriteProperties] = React.useState<Property[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const favoritesColRef = useMemoFirebase(
        () => (user ? collection(firestore, `users/${user.uid}/favorites`) : null),
        [user, firestore]
    );

    React.useEffect(() => {
        const fetchFavorites = async () => {
            if (!favoritesColRef) return;

            setIsLoading(true);
            try {
                const favoriteSnapshots = await getDocs(favoritesColRef);
                
                const propertyPromises = favoriteSnapshots.docs.map(favDoc => {
                    const listingId = favDoc.id;
                    const listingRef = doc(firestore, 'listings', listingId);
                    return getDoc(listingRef);
                });

                const propertySnapshots = await Promise.all(propertyPromises);

                const properties: Property[] = propertySnapshots
                    .filter(docSnap => docSnap.exists())
                    .map(docSnap => ({
                        id: docSnap.id,
                        ...docSnap.data()
                    } as Property));

                setFavoriteProperties(properties);
            } catch (error) {
                console.error("Error fetching favorite properties: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (!isUserLoading && user) {
            fetchFavorites();
        } else if (!isUserLoading && !user) {
            setIsLoading(false);
        }

    }, [user, isUserLoading, firestore, favoritesColRef]);

    if (isLoading || isUserLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>;
    }
    
    if (!user) {
        return (
          <div className="container mx-auto py-8 text-center">
            <h2 className="text-2xl font-bold">Please log in</h2>
            <p className="text-muted-foreground mt-2">You need to be logged in to see your favorite listings.</p>
            <Button asChild className="mt-4"><Link href="/login">Log In</Link></Button>
          </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold font-headline">Your Favorites</h1>
                <p className="text-muted-foreground">All the places you've saved, all in one place.</p>
            </div>

            {favoriteProperties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {favoriteProperties.map(property => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold text-muted-foreground">No favorites yet.</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Click the heart on any listing to save it here.
                    </p>
                    <Button asChild className="mt-6" variant="outline">
                        <Link href="/">Start Exploring</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
