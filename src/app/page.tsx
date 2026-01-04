
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { Search, Users, ArrowRight, Loader2, MapPin, Home as HomeIcon, Building } from 'lucide-react';
import PropertyCard from '@/components/property-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Property } from '@/lib/types';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { propertyTypes } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';


function SearchSuggestions({ listings, onSelect }: { listings: Property[]; onSelect: (query: string) => void }) {
    if (listings.length === 0) {
        return <div className="p-4 text-sm text-muted-foreground">No suggestions found.</div>;
    }

    const locations = [...new Set(listings.map(l => l.location))];
    const types = [...new Set(listings.map(l => propertyTypes.find(pt => pt.id === l.propertyType)?.label).filter(Boolean))];

    return (
        <ScrollArea className="h-auto max-h-72">
            <div className="space-y-4 p-2">
                {locations.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm px-4 py-2">Locations</h4>
                        {locations.map(location => (
                            <div key={location} onClick={() => onSelect(location)} className="flex items-center gap-3 p-3 hover:bg-accent rounded-md cursor-pointer">
                                <div className="bg-muted rounded-md p-2"><MapPin className="h-5 w-5" /></div>
                                <span>{location}</span>
                            </div>
                        ))}
                    </div>
                )}
                 {types.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm px-4 py-2">Property Types</h4>
                        {types.map(type => (
                            <div key={type} onClick={() => onSelect(type!)} className="flex items-center gap-3 p-3 hover:bg-accent rounded-md cursor-pointer">
                                <div className="bg-muted rounded-md p-2"><HomeIcon className="h-5 w-5" /></div>
                                <span>{type}</span>
                            </div>
                        ))}
                    </div>
                )}
                {listings.length > 0 && (
                     <div>
                        <h4 className="font-semibold text-sm px-4 py-2">Listings</h4>
                        {listings.slice(0, 5).map(listing => (
                            <div key={listing.id} onClick={() => onSelect(listing.title)} className="flex items-center gap-3 p-3 hover:bg-accent rounded-md cursor-pointer">
                               <div className="bg-muted rounded-md p-2"><Building className="h-5 w-5" /></div>
                               <span>{listing.title}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}


export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');
  const firestore = useFirestore();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [guests, setGuests] = React.useState(2);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  const featuredListingsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'listings'), orderBy('createdAt', 'desc'), limit(8)) : null,
    [firestore]
  );
  
  const allListingsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'listings')) : null,
    [firestore]
  );

  const { data: properties, isLoading: isLoadingFeatured } = useCollection<Property>(featuredListingsQuery);
  const { data: allListings } = useCollection<Property>(allListingsQuery);

  const filteredSuggestions = React.useMemo(() => {
    if (!searchQuery || !allListings) return [];
    const lowerCaseQuery = searchQuery.toLowerCase();
    return allListings.filter(listing => 
        listing.title.toLowerCase().includes(lowerCaseQuery) ||
        listing.location.toLowerCase().includes(lowerCaseQuery) ||
        propertyTypes.find(pt => pt.id === listing.propertyType)?.label.toLowerCase().includes(lowerCaseQuery) ||
        listing.host?.name?.toLowerCase().includes(lowerCaseQuery)
    );
  }, [searchQuery, allListings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(searchQuery);
  };
  
  const submitSearch = (query: string) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (guests > 0) params.append('guests', guests.toString());
    router.push(`/search?${params.toString()}`);
  }


  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative w-full">
        <div className="relative h-[400px] md:h-[500px] w-full">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover"
              priority
              data-ai-hint={heroImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
            <div className="relative z-10 flex flex-col items-center space-y-4 md:space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">
                    Find Your Next Stay
                </h1>
                <p className="text-lg md:text-xl max-w-2xl hidden sm:block">
                    Unforgettable trips start with StayNest. Find adventures nearby or in faraway places and access unique homes, experiences, and places around the world.
                </p>
                <Card className="w-full max-w-4xl p-2 md:p-4 bg-background/90 backdrop-blur-sm">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-10 gap-2 md:gap-4 items-center">
                    <div className="md:col-span-7 lg:col-span-8 relative">
                       <Popover open={isSearchFocused && searchQuery.length > 0 && filteredSuggestions.length > 0} onOpenChange={setIsSearchFocused}>
                            <PopoverTrigger asChild>
                                 <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search location, property type, host name..."
                                        className="pl-10 h-12 text-base"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setIsSearchFocused(false)}
                                    />
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                               <SearchSuggestions listings={filteredSuggestions} onSelect={(query) => {
                                   setSearchQuery(query);
                                   submitSearch(query);
                               }} />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="md:col-span-3 lg:col-span-2">
                        <Popover>
                          <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start font-normal text-muted-foreground h-12 text-base">
                              <Users className="mr-2 h-5 w-5" />
                              {guests} guest{guests !== 1 ? 's' : ''}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-4">
                              <div className="space-y-2">
                              <Label htmlFor="guests" className="font-semibold">Guests</Label>
                              <div className="flex items-center gap-4">
                                <Button variant="outline" size="icon" onClick={() => setGuests(g => Math.max(1, g - 1))} disabled={guests <= 1}>-</Button>
                                <Input id="guests" type="number" value={guests} onChange={e => setGuests(Number(e.target.value))} className="w-16 text-center" />
                                <Button variant="outline" size="icon" onClick={() => setGuests(g => g + 1)}>+</Button>
                              </div>
                              </div>
                          </PopoverContent>
                        </Popover>
                    </div>
                    <Button type="submit" className="md:col-span-10 w-full h-12" size="lg" aria-label="Search">
                        <Search className="h-5 w-5 md:hidden" />
                        <span className="hidden md:inline">Search</span>
                    </Button>
                    </form>
                </Card>
            </div>
        </div>
      </section>

      <section className="py-12 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold font-headline">Featured Stays</h2>
            <Link href="/search" className="flex items-center gap-2 text-primary hover:underline">
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {isLoadingFeatured && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin h-12 w-12" />
            </div>
          )}
          {!isLoadingFeatured && properties && properties.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
           {!isLoadingFeatured && (!properties || properties.length === 0) && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-muted-foreground">
                No listings available yet.
              </h3>
              <p className="text-sm text-muted-foreground">
                Check back later or be the first to host!
              </p>
            </div>
          )}
        </div>
      </section>
      
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} StayNest. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
