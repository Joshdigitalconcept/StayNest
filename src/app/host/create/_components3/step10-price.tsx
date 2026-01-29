'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Step10Props {
  setFormData: (data: any) => void;
  formData: any;
}

export default function Step10_Price({ setFormData, formData }: Step10Props) {
  const handlePriceChange = (key: string, value: string) => {
    const price = parseInt(value, 10);
    if (!isNaN(price)) {
      setFormData({ [key]: price });
    } else if (value === '') {
      setFormData({ [key]: 0 });
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Now, set your price</h2>
      <p className="text-muted-foreground mb-8">You can change it anytime. Prices are in Nigerian Naira (₦).</p>
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="weekdayPrice" className="text-lg">Weekday price per night</Label>
          <div className="relative mt-2">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₦</span>
            <Input
              id="weekdayPrice"
              type="number"
              placeholder="50000"
              value={formData.pricePerNight || ''}
              onChange={(e) => handlePriceChange('pricePerNight', e.target.value)}
              className="pl-7 text-2xl h-16"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="weekendPrice" className="text-lg">Weekend price per night</Label>
          <div className="relative mt-2">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₦</span>
            <Input
              id="weekendPrice"
              type="number"
              placeholder="65000"
              value={formData.weekendPrice || ''}
              onChange={(e) => handlePriceChange('weekendPrice', e.target.value)}
              className="pl-7 text-2xl h-16"
            />
          </div>
           <p className="text-sm text-muted-foreground mt-2">Optional: Set a different price for Fridays and Saturdays.</p>
        </div>
      </div>
    </div>
  );
}
