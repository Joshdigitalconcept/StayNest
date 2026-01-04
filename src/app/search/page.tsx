
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Loader2, ArrowLeft } from 'lucide-react';
import PropertyCard from '@/components/property-card';
import type { Property } from '@/lib/types';
import { propertyTypes } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function SearchResults() {
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    
    const searchQuery = searchParams.get('q') || '';
    const guestsQuery = parseInt(searchParams.get('guests') || '0', 10);

    const allListingsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'listings')) : null,
        [firestore]
    );

    const { data: allListings, isLoading, error } = useCollection<Property>(allListingsQuery);

    const filteredListings = React.useMemo(() => {
        if (!allListings) return [];

        let listings = allListings;
        
        // Filter by guest count
        if (guestsQuery > 0) {
            listings = listings.filter(p => p.maxGuests >= guestsQuery);
        }
        
        // Filter by search query
        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            listings = listings.filter(p => {
                const typeInfo = propertyTypes.find(type => type.id === p.propertyType);
                return (
                    p.title.toLowerCase().includes(lowerCaseQuery) ||
                    p.location.toLowerCase().includes(lowerCaseQuery) ||
                    (p.host?.name && p.host.name.toLowerCase().includes(lowerCaseQuery)) ||
                    (typeInfo && typeInfo.label.toLowerCase().includes(lowerCaseQuery))
                );
            });
        }
        
        return listings;

    }, [allListings, searchQuery, guestsQuery]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-12 w-12" /></div>;
    }
    
    if (error) {
        return <div className="text-center py-12 text-destructive">Error: {error.message}</div>
    }

    const resultCount = filteredListings.length;
    const resultText = resultCount === 1 ? '1 result' : `${resultCount} results`;
    const searchText = searchQuery ? ` for "${searchQuery}"` : '';
    const guestText = guestsQuery > 0 ? ` for ${guestsQuery} guest${guestsQuery > 1 ? 's' : ''}` : '';

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8 space-y-4">
                 <Button variant="outline" asChild>
                    <Link href="/" className="inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to search
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Search Results</h1>
                    <p className="text-muted-foreground">{resultText}{searchText}{guestText}</p>
                </div>
            </div>
            
            {filteredListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredListings.map(property => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold text-muted-foreground">No matching listings found.</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Try adjusting your search criteria.
                    </p>
                </div>
            )}
        </div>
    );
}


export default function SearchPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>}>
            <SearchResults />
        </React.Suspense>
    );
}

    