'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, Star, UploadCloud } from "lucide-react";

interface Step6Props {
  setFormData: (data: any) => void;
  formData: any;
}

type UploadedImage = {
  file: File;
  previewUrl: string;
};

export default function Step6_Photos({ setFormData, formData }: Step6Props) {
  const [images, setImages] = useState<UploadedImage[]>(formData.images || []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      const allImages = [...images, ...newFiles];
      setImages(allImages);
      setFormData({ images: allImages });
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);
    setFormData({ images: newImages });
  };
  
  const setAsCoverPhoto = (indexToMove: number) => {
    if (indexToMove === 0) return;
    const itemToMove = images[indexToMove];
    const remainingItems = images.filter((_, index) => index !== indexToMove);
    const newImages = [itemToMove, ...remainingItems];
    setImages(newImages);
    setFormData({ images: newImages });
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Add some photos of your place</h2>
      <p className="text-muted-foreground mb-8">You'll need at least one photo to get started. You can add more or make changes later.</p>

      <div className="mb-8">
        <label htmlFor="photo-upload" className="block w-full border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary">
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Click to upload photos</h3>
          <p className="mt-1 text-sm text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
          <Input id="photo-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleFileChange} />
        </label>
      </div>

      {images.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Your photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img, index) => (
              <div key={index} className="relative aspect-video group bg-muted rounded-lg overflow-hidden">
                <Image src={img.previewUrl} alt={`Preview ${index}`} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleRemoveImage(index)}>
                      <X className="w-4 h-4"/>
                   </Button>
                   <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setAsCoverPhoto(index)} disabled={index === 0}>
                      <Star className={`w-4 h-4 ${index === 0 ? 'fill-amber-400 text-amber-500' : ''}`} />
                   </Button>
                </div>
                {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-background/80 text-foreground text-xs px-2 py-1 rounded-md font-semibold">Cover Photo</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
