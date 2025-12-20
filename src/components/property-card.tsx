'use client';

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Edit, Trash2, Loader2, Heart } from "lucide-react";
import type { Property } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFirestore, errorEmitter, FirestorePermissionError, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, deleteDoc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface PropertyCardProps {
  property: Property;
  showAdminControls?: boolean;
}

export default function PropertyCard({ property, showAdminControls = false }: PropertyCardProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  const userFavoritesQuery = useMemoFirebase(
    () => user ? collection(firestore, `users/${user.uid}/favorites`) : null,
    [user, firestore]
  );
  const { data: favorites } = useCollection(userFavoritesQuery);
  const isFavorited = React.useMemo(() => favorites?.some(fav => fav.id === property.id), [favorites, property.id]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!firestore || !property.id) return;
    
    setIsDeleting(true);
    const docRef = doc(firestore, 'listings', property.id);

    try {
      await deleteDoc(docRef);
      toast({
        title: "Listing Deleted",
        description: "Your property has been successfully deleted.",
      });
      // The component will unmount if the parent component's state updates
    } catch (error) {
       const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);

      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete the listing. Please try again.",
      });
      setIsDeleting(false);
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        variant: "destructive",
        title: "Please log in",
        description: "You need to be logged in to favorite a listing.",
      });
      router.push('/login');
      return;
    }

    const favoriteRef = doc(firestore, `users/${user.uid}/favorites`, property.id);

    try {
      if (isFavorited) {
        // Unfavorite
        await deleteDoc(favoriteRef);
        toast({ title: "Removed from favorites." });
      } else {
        // Favorite
        await setDoc(favoriteRef, { 
          listingId: property.id,
          favoritedAt: serverTimestamp() 
        });
        toast({ title: "Added to favorites!" });
      }
    } catch (error) {
       const permissionError = new FirestorePermissionError({
          path: favoriteRef.path,
          operation: isFavorited ? 'delete' : 'create',
        });
        errorEmitter.emit('permission-error', permissionError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    }
  };


  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-xl flex flex-col">
      <Link href={`/properties/${property.id}`} className="block">
        <div className="relative h-48 w-full">
          {!showAdminControls && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 left-2 z-10 rounded-full bg-background/70 hover:bg-background"
              onClick={handleFavoriteToggle}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
            </Button>
          )}
          {property.imageUrl && (
            <Image
              src={property.imageUrl}
              alt={property.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
           {!property.imageUrl && (
             <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No Image</span>
             </div>
           )}
          <Badge className="absolute top-2 right-2 flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>{property.rating ? property.rating.toFixed(1) : 'New'}</span>
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg truncate">{property.title}</h3>
          <p className="text-muted-foreground text-sm truncate">{property.location}</p>
          <div className="mt-2 flex items-baseline">
            <p className="font-bold text-lg">${property.pricePerNight}</p>
            <span className="text-muted-foreground text-sm ml-1">/ night</span>
          </div>
        </CardContent>
      </Link>
      {showAdminControls && (
        <div className="mt-auto p-4 pt-0 flex gap-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
             <Link href={`/properties/edit/${property.id}`}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full">
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} 
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  listing and remove its data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Card>
  );
}
