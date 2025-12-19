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
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Loader2, X, Crop } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const amenitiesList = [
  "Wifi", "Kitchen", "Free parking", "Heating", "TV", "Air conditioning", "Pool", "Elevator", "Gym"
];

const IMGBB_API_KEY = "ed5db0bd942fd835bfbbce28c31bc2b9";

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
  images: z.array(z.any()).min(1, 'At least one property image is required.'),
  aspectRatio: z.enum(['landscape', 'portrait']),
});

type UploadedImage = {
  originalFile: File;
  previewUrl: string;
  croppedBlob: Blob | null;
}

export default function NewPropertyPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [croppingImageIndex, setCroppingImageIndex] = useState<number | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<CropType>();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      pricePerNight: 100,
      cleaningFee: 50,
      serviceFee: 25,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      amenities: [],
      images: [],
      aspectRatio: 'landscape',
    },
  });

  const currentAspectRatio = form.watch('aspectRatio') === 'landscape' ? 16 / 9 : 4 / 5;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const newUploadedImages: UploadedImage[] = newFiles.map(file => ({
        originalFile: file,
        previewUrl: URL.createObjectURL(file),
        croppedBlob: null,
      }));
      
      const allImages = [...uploadedImages, ...newUploadedImages];
      setUploadedImages(allImages);
      form.setValue('images', allImages.map(img => img.croppedBlob || img.originalFile), { shouldValidate: true });
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    URL.revokeObjectURL(uploadedImages[indexToRemove].previewUrl);
    const newImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    setUploadedImages(newImages);
    form.setValue('images', newImages.map(img => img.croppedBlob || img.originalFile), { shouldValidate: true });
  };
  
  const openCropper = (index: number) => {
    setCroppingImageIndex(index);
    setIsCropDialogOpen(true);
  };
  
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        currentAspectRatio,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }

  async function handleSaveCrop() {
    if (!croppingImageIndex === null || !imgRef.current || !crop || croppingImageIndex === null) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const updatedImages = [...uploadedImages];
        const croppedUrl = URL.createObjectURL(blob);
        updatedImages[croppingImageIndex].croppedBlob = blob;
        updatedImages[croppingImageIndex].previewUrl = croppedUrl; // Update preview to cropped version
        setUploadedImages(updatedImages);
        form.setValue('images', updatedImages.map(img => img.croppedBlob || img.originalFile), { shouldValidate: true });
      }
    }, 'image/jpeg', 0.95);

    setIsCropDialogOpen(false);
    setCroppingImageIndex(null);
  }

  async function uploadImage(image: File | Blob): Promise<string | null> {
    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) return result.data.url;
      else throw new Error(result.error.message || 'ImgBB upload failed');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Image Upload Failed',
        description: `Could not upload image. ${error.message}`,
      });
      return null;
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to create a listing.' });
      return;
    }

    setIsSubmitting(true);
    
    const imagesToUpload = uploadedImages.map(img => img.croppedBlob || img.originalFile);

    const uploadPromises = imagesToUpload.map(uploadImage);
    const imageUrls = await Promise.all(uploadPromises);

    const successfulUrls = imageUrls.filter((url): url is string => url !== null);

    if (successfulUrls.length !== imagesToUpload.length) {
      toast({ variant: 'destructive', title: 'Image Upload Error', description: 'Some images failed to upload. Please try again.' });
      setIsSubmitting(false);
      return;
    }
    
    const { images, aspectRatio, ...restOfValues } = values;

    const listingData = {
      ...restOfValues,
      imageUrl: successfulUrls[0],
      imageUrls: successfulUrls,
      ownerId: user.uid,
      rating: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const listingsColRef = collection(firestore, 'listings');

    addDoc(listingsColRef, listingData)
      .then((docRef) => {
        toast({ title: 'Listing Created!', description: 'Your property has been successfully listed.' });
        router.push(`/properties/${docRef.id}`);
      })
      .catch((error: any) => {
        const permissionError = new FirestorePermissionError({
          path: listingsColRef.path,
          operation: 'create',
          requestResourceData: listingData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: 'Uh oh! Something went wrong.', description: 'Could not create listing. Please try again.' });
      }).finally(() => {
         setIsSubmitting(false);
      });
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Create a New Listing</CardTitle>
          <CardDescription>Fill out the details below to list your property on StayNest.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="aspectRatio"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Image Orientation</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                        disabled={isSubmitting}
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="landscape" />
                          </FormControl>
                          <FormLabel className="font-normal">Landscape (16:9)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="portrait" />
                          </FormControl>
                          <FormLabel className="font-normal">Portrait (4:5)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="images"
                render={() => (
                  <FormItem>
                    <FormLabel>Property Images</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                        onClick={(event) => { (event.target as HTMLInputElement).value = ''; }}
                      />
                    </FormControl>
                    <FormDescription>Upload your images. The first will be the cover photo. You can crop them after uploading.</FormDescription>
                    <FormMessage />
                    {uploadedImages.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {uploadedImages.map((img, index) => (
                          <div key={index} className="relative w-full aspect-video rounded-md overflow-hidden group bg-muted">
                            <Image
                              src={img.previewUrl}
                              alt={`Image preview ${index + 1}`}
                              fill
                              className="object-contain"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openCropper(index)}
                                disabled={isSubmitting}
                              >
                                <Crop className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRemoveImage(index)}
                                disabled={isSubmitting}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Property Title</FormLabel> <FormControl><Input placeholder="e.g., Cozy Forest Cabin" {...field} disabled={isSubmitting} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Description</FormLabel> <FormControl><Textarea placeholder="Tell guests about your place" className="resize-none" {...field} disabled={isSubmitting} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="location" render={({ field }) => ( <FormItem> <FormLabel>Location</FormLabel> <FormControl><Input placeholder="e.g., Asheville, North Carolina" {...field} disabled={isSubmitting} /></FormControl> <FormMessage /> </FormItem> )} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FormField control={form.control} name="pricePerNight" render={({ field }) => ( <FormItem> <FormLabel>Price per night ($)</FormLabel> <FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="cleaningFee" render={({ field }) => ( <FormItem> <FormLabel>Cleaning Fee ($)</FormLabel> <FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="serviceFee" render={({ field }) => ( <FormItem> <FormLabel>Service Fee ($)</FormLabel> <FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl> <FormMessage /> </FormItem> )}/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FormField control={form.control} name="maxGuests" render={({ field }) => ( <FormItem> <FormLabel>Maximum Guests</FormLabel> <FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="bedrooms" render={({ field }) => ( <FormItem> <FormLabel>Bedrooms</FormLabel> <FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="bathrooms" render={({ field }) => ( <FormItem> <FormLabel>Bathrooms</FormLabel> <FormControl><Input type="number" {...field} disabled={isSubmitting} /></FormControl> <FormMessage /> </FormItem> )}/>
              </div>
              
              <FormField
                control={form.control}
                name="amenities"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Amenities</FormLabel>
                      <FormDescription>
                        Select the amenities your place offers.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {amenitiesList.map((item) => (
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
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" disabled={isSubmitting || isUserLoading}>
                {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>) : ('Create Listing')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          {croppingImageIndex !== null && uploadedImages[croppingImageIndex] && (
            <div className="flex justify-center items-center" style={{height: '60vh'}}>
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  aspect={currentAspectRatio}
                  className="max-h-full"
                >
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    src={uploadedImages[croppingImageIndex].previewUrl}
                    onLoad={onImageLoad}
                    style={{ maxHeight: '60vh', objectFit: 'contain' }}
                  />
                </ReactCrop>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveCrop}>Save Crop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    