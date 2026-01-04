
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { Search, Users, ArrowRight, Loader2 } from 'lucide-react';
import PropertyCard from '@/components/property-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Property } from '@/lib/types';
import * as React from 'react';
import { useRouter } from 'next/navigation';


export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');
  const firestore = useFirestore();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [guests, setGuests] = React.useState(2);

  const listingsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'listings'), orderBy('createdAt', 'desc'), limit(8)) : null,
    [firestore]
  );
  
  const { data: properties, isLoading } = useCollection<Property>(listingsQuery);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (guests > 0) params.append('guests', guests.toString());
    router.push(`/search?${params.toString()}`);
  };


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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Search location, property type, host name..."
                          className="pl-10 h-12 text-base"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
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
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin h-12 w-12" />
            </div>
          )}
          {!isLoading && properties && properties.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
           {!isLoading && (!properties || properties.length === 0) && (
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
