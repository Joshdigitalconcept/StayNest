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
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase } from '@/firebase';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const amenitiesList = [
  "Wifi", "Kitchen", "Free parking", "Heating", "TV", "Air conditioning", "Pool", "Elevator", "Gym"
];

// No image upload on the edit page for simplicity, can be added later.
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(1, 'Location is required'),
  pricePerNight: z.coerce.number().min(1, 'Price must be greater than 0'),
  cleaningFee: z.coerce.number().min(0, 'Cleaning fee cannot be negative'),
  serviceFee: z.coerce.number().min(0, 'Service fee cannot be negative'),
  maxGuests: z.coerce.number().min(1, 'Max guests must be at least 1'),
  bedrooms: z.coerce.number().min(0, 'Bedrooms cannot be negative'),
  bathrooms: z.coerce.number().min(0, 'Bathrooms cannot be negative'),
  amenities: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
});

export default function EditPropertyPage({ params: { id } }: { params: { id: string } }) {
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
      cleaningFee: 0,
      serviceFee: 0,
      maxGuests: 1,
      bedrooms: 0,
      bathrooms: 0,
      amenities: [],
    },
  });
  
  React.useEffect(() => {
    if (listing) {
      // Check if user is the owner
      if (user && user.uid !== listing.ownerId) {
        toast({
          variant: 'destructive',
          title: 'Unauthorized',
          description: "You don't have permission to edit this listing.",
        });
        router.push('/');
      }
      form.reset(listing);
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
            Update the details for your property.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                      <Textarea placeholder="Tell guests about your place" className="resize-none" {...field} disabled={isSubmitting} />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FormField
                  control={form.control}
                  name="pricePerNight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per night ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="cleaningFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cleaning Fee ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="serviceFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Fee ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FormField
                  control={form.control}
                  name="maxGuests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Guests</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathrooms</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="amenities"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Amenities</FormLabel>
                      <FormDescription>
                        Select the amenities your place offers.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {amenitiesList.map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="amenities"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item
                                            )
                                          )
                                    }}
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item}
                                </FormLabel>
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
              <div className="flex gap-4">
                  <Button type="submit" size="lg" disabled={isSubmitting || isLoading}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
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
