'use client';

import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError, useAuth } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

const IMGBB_API_KEY = "ed5db0bd942fd835bfbbce28c31bc2b9";

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  profilePicture: z.instanceof(File).optional(),
  about: z.string().optional(),
  live: z.string().optional(),
  work: z.string().optional(),
  languages: z.string().optional(),
  school: z.string().optional(),
  born: z.string().optional(),
  obsessedWith: z.string().optional(),
  uselessSkill: z.string().optional(),
  biographyTitle: z.string().optional(),
  favoriteSong: z.string().optional(),
  spendTooMuchTime: z.string().optional(),
  funFact: z.string().optional(),
  pets: z.string().optional(),
  travelGoal: z.string().optional(),
});

export default function EditProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userDocRef = useMemoFirebase(
    () => (user && firestore) ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      about: '',
      live: '',
      work: '',
      languages: '',
      school: '',
      born: '',
      obsessedWith: '',
      uselessSkill: '',
      biographyTitle: '',
      favoriteSong: '',
      spendTooMuchTime: '',
      funFact: '',
      pets: '',
      travelGoal: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        about: userProfile.about || '',
        live: userProfile.live || '',
        work: userProfile.work || '',
        languages: userProfile.languages || '',
        school: userProfile.school || '',
        born: userProfile.born || '',
        obsessedWith: userProfile.obsessedWith || '',
        uselessSkill: userProfile.uselessSkill || '',
        biographyTitle: userProfile.biographyTitle || '',
        favoriteSong: userProfile.favoriteSong || '',
        spendTooMuchTime: userProfile.spendTooMuchTime || '',
        funFact: userProfile.funFact || '',
        pets: userProfile.pets || '',
        travelGoal: userProfile.travelGoal || '',
      });
    }
  }, [userProfile, form]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('profilePicture', file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  async function uploadImage(image: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('image', image);
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        return result.data.url;
      } else {
        throw new Error(result.error.message || 'ImgBB upload failed');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Image Upload Failed',
        description: error.message,
      });
      return null;
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !userDocRef) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to edit your profile.',
      });
      return;
    }

    setIsSubmitting(true);

    let newProfilePictureUrl: string | undefined = undefined;
    const { profilePicture, ...otherValues } = values;

    if (profilePicture) {
      const uploadedUrl = await uploadImage(profilePicture);
      if (uploadedUrl) {
        newProfilePictureUrl = uploadedUrl;
      } else {
        setIsSubmitting(false);
        return; // Stop submission if image upload fails
      }
    }

    const firestoreUpdateData: { [key: string]: any } = {
      ...otherValues,
      updatedAt: serverTimestamp(),
    };

    if (newProfilePictureUrl) {
      firestoreUpdateData.profilePictureUrl = newProfilePictureUrl;
    }

    const authUpdateData = {
      displayName: `${values.firstName} ${values.lastName}`.trim(),
      photoURL: newProfilePictureUrl || user.photoURL,
    };
    
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, authUpdateData);
      }
      await updateDoc(userDocRef, firestoreUpdateData);

      toast({
        title: 'Profile Updated!',
        description: 'Your profile has been successfully updated.',
      });
      router.push('/account?section=personal-info');
    } catch (error: any) {
      const isFirestoreError = error.code && error.code.startsWith('permission-denied');
      if (isFirestoreError) {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: firestoreUpdateData,
        });
        errorEmitter.emit('permission-error', permissionError);
      }
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'Could not update your profile. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>;
  }
  
  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Please log in to edit your profile.</p>
        <Button asChild className="mt-4"><Link href="/login">Log In</Link></Button>
      </div>
    );
  }
  
  const profileFields = [
      { name: "about", label: "About me", placeholder: "Write something fun and punchy.", component: "textarea" },
      { name: "work", label: "My work", placeholder: "What do you do for work?" },
      { name: "live", label: "Where I live", placeholder: "e.g. San Francisco, CA" },
      { name: "school", label: "Where I went to school", placeholder: "e.g. University of California, Berkeley" },
      { name: "languages", label: "Languages I speak", placeholder: "e.g. English, Spanish" },
      { name: "born", label: "Decade I was born", placeholder: "e.g. 1990s" },
      { name: "pets", label: "My pets", placeholder: "Do you have any pets?" },
      { name: "favoriteSong", label: "My favorite song in high school", placeholder: "e.g. Wonderwall by Oasis" },
      { name: "obsessedWith", label: "I'm obsessed with", placeholder: "e.g. Learning new languages" },
      { name: "funFact", label: "My fun fact", placeholder: "e.g. I can juggle" },
      { name: "uselessSkill", label: "My most useless skill", placeholder: "e.g. Can name all the US presidents in order" },
      { name: "biographyTitle", label: "My biography title would be", placeholder: "e.g. The Adventures of a Curious Mind" },
      { name: "spendTooMuchTime", label: "I spend too much time", placeholder: "e.g. Watching cat videos on the internet" },
      { name: "travelGoal", label: "Where I've always wanted to go", placeholder: "e.g. See the Northern Lights in Iceland" },
  ] as const;

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Edit Profile</CardTitle>
          <CardDescription>
            Hosts and guests can see your profile. Keep it up to date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="profilePicture"
                render={() => (
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={imagePreview || user.photoURL || undefined} alt="Profile Picture Preview" />
                        <AvatarFallback className="text-3xl">{user.displayName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange}
                          disabled={isSubmitting}
                          className="max-w-xs"
                        />
                      </FormControl>
                    </div>
                    <FormDescription>
                      Upload a new photo for your profile.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {profileFields.map((fieldInfo) => (
                  <FormField
                    key={fieldInfo.name}
                    control={form.control}
                    name={fieldInfo.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{fieldInfo.label}</FormLabel>
                        <FormControl>
                          {fieldInfo.component === 'textarea' ? (
                            <Textarea placeholder={fieldInfo.placeholder} {...field} disabled={isSubmitting} />
                          ) : (
                            <Input placeholder={fieldInfo.placeholder} {...field} disabled={isSubmitting} />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>


              <div className="flex gap-4 pt-4">
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
                  <Link href="/account?section=personal-info">Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
