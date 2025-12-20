'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase } from '@/firebase';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { amenitiesList, propertyTypes, guestSpaces, bathroomTypes, whoElseOptions } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(1, 'Location is required'),
  pricePerNight: z.coerce.number().min(1, 'Price must be greater than 0'),
  weekendPrice: z.coerce.number().min(0, 'Weekend price cannot be negative'),
  cleaningFee: z.coerce.number().min(0, 'Cleaning fee cannot be negative'),
  serviceFee: z.coerce.number().min(0, 'Service fee cannot be negative'),
  maxGuests: z.coerce.number().min(1, 'Max guests must be at least 1'),
  bedrooms: z.coerce.number().min(0, 'Bedrooms cannot be negative'),
  bathrooms: z.coerce.number().min(0, 'Bathrooms cannot be negative'),
  beds: z.coerce.number().min(0, 'Beds cannot be negative'),
  amenities: z.array(z.string()).min(1, "You must select at least one amenity."),
  propertyType: z.string().min(1, 'Please select a property type.'),
  guestSpace: z.string().min(1, 'Please select the type of space guests will have.'),
  bathroomType: z.string().min(1, 'Please select the bathroom type.'),
  bookingSettings: z.enum(['instant', 'approval']),
  newListingPromotion: z.boolean().default(false),
  weeklyDiscount: z.boolean().default(false),
  monthlyDiscount: z.boolean().default(false),
});

export default function EditPropertyPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const listingRef = useMemoFirebase(
    () => (firestore && id) ? doc(firestore, 'listings', id) : null,
    [firestore, id]
  );
  const { data: listing, isLoading: isListingLoading } = useDoc(listingRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      pricePerNight: 0,
      weekendPrice: 0,
      cleaningFee: 0,
      serviceFee: 0,
      maxGuests: 1,
      bedrooms: 0,
      bathrooms: 0,
      beds: 0,
      amenities: [],
      propertyType: '',
      guestSpace: '',
      bathroomType: '',
      bookingSettings: 'instant',
      newListingPromotion: false,
      weeklyDiscount: false,
      monthlyDiscount: false,
    },
  });
  
  React.useEffect(() => {
    if (listing) {
      if (user && user.uid !== listing.ownerId) {
        toast({
          variant: 'destructive',
          title: 'Unauthorized',
          description: "You don't have permission to edit this listing.",
        });
        router.push('/');
        return;
      }
      form.reset({
          title: listing.title || '',
          description: listing.description || '',
          location: listing.location || '',
          pricePerNight: listing.pricePerNight || 0,
          weekendPrice: listing.weekendPrice || 0,
          cleaningFee: listing.cleaningFee || 0,
          serviceFee: listing.serviceFee || 0,
          maxGuests: listing.maxGuests || 1,
          bedrooms: listing.bedrooms || 0,
          bathrooms: listing.bathrooms || 0,
          beds: listing.beds || 0,
          amenities: listing.amenities || [],
          propertyType: listing.propertyType || '',
          guestSpace: listing.guestSpace || '',
          bathroomType: listing.bathroomType || '',
          bookingSettings: listing.bookingSettings || 'instant',
          newListingPromotion: listing.newListingPromotion || false,
          weeklyDiscount: listing.weeklyDiscount || false,
          monthlyDiscount: listing.monthlyDiscount || false,
      });
    }
  }, [listing, form, user, router, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !listingRef) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to update a listing.',
      });
      return;
    }

    setIsSubmitting(true);
    
    const listingUpdateData = {
      ...values,
      updatedAt: serverTimestamp(),
    };

    updateDoc(listingRef, listingUpdateData)
      .then(() => {
        toast({
          title: 'Listing Updated!',
          description: 'Your property has been successfully updated.',
        });
        router.push(`/properties/${id}`);
      })
      .catch((error: any) => {
        const permissionError = new FirestorePermissionError({
          path: listingRef.path,
          operation: 'update',
          requestResourceData: listingUpdateData,
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'Could not update listing. Please try again.',
        });
      }).finally(() => {
         setIsSubmitting(false);
      });
  }
  
  const isLoading = isUserLoading || isListingLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>;
  }
  
  if (!listing) {
      return (
        <div className="container mx-auto py-8 text-center">
            <h2 className="text-2xl font-bold">Listing not found</h2>
            <p className="text-muted-foreground">The listing you are trying to edit does not exist.</p>
            <Button asChild className="mt-4"><Link href="/profile?tab=properties">Go to my properties</Link></Button>
        </div>
      );
  }

  return (
    <div className="container mx-auto py-8">
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
            <CardTitle className="text-3xl font-headline">Edit Listing</CardTitle>
            <CardDescription>
                Update the details for your property. Changes will be live immediately.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                
                {/* --- IMAGES SECTION --- */}
                <div>
                    <h3 className="text-xl font-semibold mb-4">Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {listing.imageUrls?.map((url, index) => (
                            <div key={index} className="relative w-full aspect-square rounded-md overflow-hidden">
                            <Image
                                src={url}
                                alt={`Image preview ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                            </div>
                        ))}
                    </div>
                     <FormDescription className="mt-2">Photo management is not available in this editor yet.</FormDescription>
                </div>

                <Separator />
                
                {/* --- BASIC INFO SECTION --- */}
                <div className="space-y-8">
                    <h3 className="text-xl font-semibold">Listing Details</h3>
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Property Title</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Cozy Forest Cabin" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                            <Textarea placeholder="Tell guests about your place" rows={6} {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Asheville, North Carolina" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <Separator />

                 {/* --- PROPERTY STRUCTURE SECTION --- */}
                <div className="space-y-8">
                    <h3 className="text-xl font-semibold">Property Structure</h3>
                     <FormField
                        control={form.control}
                        name="propertyType"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Property Type</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 md:grid-cols-3 gap-4"
                                >
                                {propertyTypes.map(type => (
                                    <FormItem key={type.id}>
                                        <FormControl>
                                             <RadioGroupItem value={type.id} className="sr-only" />
                                        </FormControl>
                                        <Label className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:border-accent ${field.value === type.id ? 'border-accent ring-2 ring-accent' : 'border-muted'}`}>
                                            <span>{type.label}</span>
                                        </Label>
                                    </FormItem>
                                ))}
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <FormField
                            control={form.control}
                            name="guestSpace"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Guest Space</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                    >
                                    {guestSpaces.map(space => (
                                        <FormItem key={space.id} className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value={space.id} />
                                            </FormControl>
                                            <FormLabel className="font-normal">{space.label}</FormLabel>
                                        </FormItem>
                                    ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="bathroomType"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Bathroom Type</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                    >
                                    {bathroomTypes.map(type => (
                                        <FormItem key={type.id} className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value={type.id} />
                                            </FormControl>
                                            <FormLabel className="font-normal">{type.label}</FormLabel>
                                        </FormItem>
                                    ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator />
                
                {/* --- CAPACITY SECTION --- */}
                <div className="space-y-8">
                    <h3 className="text-xl font-semibold">Capacity</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <FormField control={form.control} name="maxGuests" render={({ field }) => (<FormItem><FormLabel>Max Guests</FormLabel><FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="bedrooms" render={({ field }) => (<FormItem><FormLabel>Bedrooms</FormLabel><FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="beds" render={({ field }) => (<FormItem><FormLabel>Beds</FormLabel><FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="bathrooms" render={({ field }) => (<FormItem><FormLabel>Bathrooms</FormLabel><FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>

                <Separator />
                
                {/* --- AMENITIES SECTION --- */}
                <FormField
                    control={form.control}
                    name="amenities"
                    render={() => (
                    <FormItem>
                        <h3 className="text-xl font-semibold mb-4">Amenities</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {amenitiesList.map((item) => (
                            <FormField
                            key={item}
                            control={form.control}
                            name="amenities"
                            render={({ field }) => {
                                return (
                                <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...field.value, item])
                                            : field.onChange(field.value?.filter((value) => value !== item));
                                        }}
                                        disabled={isSubmitting}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal">{item}</FormLabel>
                                </FormItem>
                                )
                            }}
                            />
                        ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                
                <Separator />

                {/* --- PRICING SECTION --- */}
                <div className="space-y-8">
                     <h3 className="text-xl font-semibold">Pricing</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField control={form.control} name="pricePerNight" render={({ field }) => (<FormItem><FormLabel>Price per night ($)</FormLabel><FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="weekendPrice" render={({ field }) => (<FormItem><FormLabel>Weekend price ($)</FormLabel><FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl><FormDescription>Optional price for Fri/Sat.</FormDescription><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="cleaningFee" render={({ field }) => (<FormItem><FormLabel>Cleaning Fee ($)</FormLabel><FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="serviceFee" render={({ field }) => (<FormItem><FormLabel>Service Fee ($)</FormLabel><FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                     </div>
                </div>

                <Separator />
                
                {/* --- BOOKING & DISCOUNTS SECTION --- */}
                 <div className="space-y-8">
                    <h3 className="text-xl font-semibold">Booking & Discounts</h3>
                     <FormField
                        control={form.control}
                        name="bookingSettings"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Booking Confirmation</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8">
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="instant" /></FormControl>
                                    <FormLabel className="font-normal">Instant Book</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="approval" /></FormControl>
                                    <FormLabel className="font-normal">Approve/Decline Requests</FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="space-y-2">
                        <FormLabel>Discounts</FormLabel>
                        <FormDescription>Offer discounts to attract more guests.</FormDescription>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <FormField control={form.control} name="newListingPromotion" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>New Listing Promotion (20%)</FormLabel></div></FormItem>)} />
                            <FormField control={form.control} name="weeklyDiscount" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Weekly Discount (5%)</FormLabel></div></FormItem>)} />
                            <FormField control={form.control} name="monthlyDiscount" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Monthly Discount (10%)</FormLabel></div></FormItem>)} />
                        </div>
                    </div>
                 </div>


                <div className="flex gap-4 pt-8">
                    <Button type="submit" size="lg" disabled={isSubmitting || isLoading}>
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                        <Link href={`/properties/${id}`}>Cancel</Link>
                    </Button>
                </div>
                </form>
            </Form>
            </CardContent>
        </Card>
    </div>
  );
}
