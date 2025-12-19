import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Calendar as CalendarIcon, Users, ArrowRight } from 'lucide-react';
import PropertyCard from '@/components/property-card';
import { mockProperties } from '@/lib/placeholder-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative h-[500px] w-full flex items-center justify-center text-center text-white">
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
        <div className="relative z-10 flex flex-col items-center space-y-6 px-4">
          <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">
            Find Your Next Stay
          </h1>
          <p className="text-lg md:text-xl max-w-2xl">
            Unforgettable trips start with StayNest. Find adventures nearby or in faraway places and access unique homes, experiences, and places around the world.
          </p>
          <Card className="w-full max-w-4xl p-4 bg-background/90 backdrop-blur-sm">
            <form className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-10 gap-4 items-center">
              <div className="md:col-span-4 lg:col-span-3 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Where are you going?" className="pl-10" />
              </div>
              <div className="md:col-span-2 lg:col-span-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal text-muted-foreground">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Check in
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="md:col-span-2 lg:col-span-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal text-muted-foreground">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Check out
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="md:col-span-2 lg:col-span-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      Guests
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4">
                    <div className="space-y-2">
                      <Label htmlFor="guests">Guests</Label>
                      <Input id="guests" type="number" defaultValue="2" />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Button className="md:col-span-4 lg:col-span-1 w-full" size="icon" aria-label="Search">
                <Search className="h-5 w-5" />
              </Button>
            </form>
          </Card>
        </div>
      </section>

      <section className="py-12 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold font-headline">Featured Stays</h2>
            <Link href="#" className="flex items-center gap-2 text-primary hover:underline">
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {mockProperties.slice(0, 8).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
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
