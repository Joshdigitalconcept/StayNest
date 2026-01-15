'use client';

import * as React from 'react';
import Image from "next/image";
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Simplified type for this component
interface UploadedImage {
  file: File;
  previewUrl: string;
}

interface Step13Props {
  formData: any;
  clearDraft: () => void;
}

async function uploadImage(imageFile: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('image', imageFile);
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!apiKey) {
    console.error("Image upload failed: API key is missing.");
    return null;
  }

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (result.success) {
      return result.data.url;
    } else {
      throw new Error(result.error.message || 'Image upload failed');
    }
  } catch (error) {
    console.error("Image upload failed:", error);
    return null;
  }
}

export default function Step13_Review({ formData, clearDraft }: Step13Props) {
  const [isPublishing, setIsPublishing] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const handlePublish = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'You must be logged in to publish.' });
      return;
    }
    
    setIsPublishing(true);
    
    // 1. Upload images
    const uploadedImageUrls: (string | null)[] = await Promise.all(
        (formData.images as UploadedImage[]).map(img => uploadImage(img.file))
    );
    
    const successfulUrls = uploadedImageUrls.filter((url): url is string => url !== null);

    if (successfulUrls.length === 0) {
        toast({ variant: 'destructive', title: 'Image upload failed. Please try again.'});
        setIsPublishing(false);
        return;
    }
    if (successfulUrls.length < formData.images.length) {
        toast({ variant: 'destructive', title: 'Some images failed to upload. Please try again.'});
    }

    // 2. Prepare listing data
    const { images, ...listingData } = formData;
    const finalData = {
        ...listingData,
        imageUrls: successfulUrls,
        imageUrl: successfulUrls[0],
        ownerId: user.uid,
        host: { name: user.displayName, photoURL: user.photoURL },
        rating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    
    try {
        // 3. Create listing and update user profile
        const listingsColRef = collection(firestore, 'listings');
        const docRef = await addDoc(listingsColRef, finalData);

        const userRef = doc(firestore, 'users', user.uid);
        // Save the address and set isHost to true
        await updateDoc(userRef, { 
            isHost: true,
            residentialAddress: formData.residentialAddress 
        });

        toast({ title: 'Congratulations!', description: 'Your listing is now live.' });
        clearDraft();
        router.push(`/properties/${docRef.id}`);

    } catch (error: any) {
        console.error("Failed to publish listing:", error);
        toast({ variant: 'destructive', title: 'Publishing failed', description: 'Could not save your listing. Please try again.' });
        if (error.code?.startsWith('permission-denied')) {
             const listingsColRef = collection(firestore, 'listings');
             const permissionError = new FirestorePermissionError({
                path: listingsColRef.path,
                operation: 'create',
                requestResourceData: finalData,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    } finally {
        setIsPublishing(false);
    }
  };


  const coverImage = formData.images?.[0]?.previewUrl;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Review your listing</h2>
      <p className="text-muted-foreground mb-8">Here's what guests will see. Make sure everything looks right.</p>

      <div className="border rounded-lg p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2">
            {coverImage ? (
              <Image src={coverImage} alt={formData.title || 'Listing preview'} width={400} height={300} className="rounded-lg object-cover w-full aspect-video" />
            ) : (
              <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">No image uploaded</p>
              </div>
            )}
          </div>
          <div className="md:w-1/2 space-y-2">
            <h3 className="text-2xl font-semibold">{formData.title || 'Your Listing Title'}</h3>
            <p className="text-muted-foreground">{formData.location || 'Your Location'}</p>
            <p className="font-bold text-xl">${formData.pricePerNight || 0} / night</p>
          </div>
        </div>
        <Button onClick={handlePublish} className="w-full bg-pink-600 hover:bg-pink-700 text-white" size="lg" disabled={isPublishing}>
          {isPublishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Publishing...</> : 'Publish Listing'}
        </Button>
      </div>
    </div>
  );
}
