'use client';

import { amenitiesList } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Step5Props {
  setFormData: (data: any) => void;
  formData: any;
}

export default function Step5_Amenities({ setFormData, formData }: Step5Props) {
  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const currentAmenities = formData.amenities || [];
    const newAmenities = checked
      ? [...currentAmenities, amenity]
      : currentAmenities.filter((a: string) => a !== amenity);
    setFormData({ amenities: newAmenities });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Tell guests what your place has to offer</h2>
      <p className="text-muted-foreground mb-8">You can add more amenities after you publish.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {amenitiesList.map((amenity) => (
          <div key={amenity} className="flex items-center space-x-3 p-4 border rounded-lg">
            <Checkbox
              id={amenity}
              checked={formData.amenities?.includes(amenity)}
              onCheckedChange={(checked) => handleAmenityChange(amenity, !!checked)}
            />
            <Label htmlFor={amenity} className="text-base cursor-pointer">{amenity}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}
