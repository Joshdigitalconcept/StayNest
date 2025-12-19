'use client';

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
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const amenitiesList = [
  "Wifi", "Kitchen", "Free parking", "Heating", "TV", "Air conditioning", "Pool", "Elevator", "Gym"
];

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(1, 'Location is required'),
  pricePerNight: z.coerce.number().min(1, 'Price must be greater than 0'),
  maxGuests: z.coerce.number().min(1, 'Max guests must be at least 1'),
  bedrooms: z.coerce.number().min(0, 'Bedrooms cannot be negative'),
  bathrooms: z.coerce.number().min(0, 'Bathrooms cannot be negative'),
  amenities: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
});

export default function NewPropertyPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      pricePerNight: 100,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      amenities: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a listing.',
      });
      return;
    }

    const listingData = {
      ...values,
      ownerId: user.uid,
      rating: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const listingsColRef = collection(firestore, 'listings');

    addDoc(listingsColRef, listingData)
      .then(() => {
        toast({
          title: 'Listing Created!',
          description: 'Your property has been successfully listed.',
        });
        router.push('/profile?tab=properties');
      })
      .catch((error: any) => {
        const permissionError = new FirestorePermissionError({
          path: listingsColRef.path,
          operation: 'create',
          requestResourceData: listingData,
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'Could not create listing. Please try again.',
        });
      });
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Create a New Listing</CardTitle>
          <CardDescription>
            Fill out the details below to list your property on StayNest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cozy Forest Cabin" {...field} />
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
                      <Textarea placeholder="Tell guests about your place" className="resize-none" {...field} />
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
                      <Input placeholder="e.g., Asheville, North Carolina" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="pricePerNight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per night ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxGuests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Guests</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
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
                        <Input type="number" {...field} />
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

              <Button type="submit" size="lg" disabled={form.formState.isSubmitting || isUserLoading}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create Listing'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
