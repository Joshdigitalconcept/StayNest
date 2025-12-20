'use client';

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";
import { bathroomTypes, whoElseOptions } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

interface Step4Props {
  setFormData: (data: any) => void;
  formData: any;
}

function Counter({ label, value, onValueChange }: { label: string, value: number, onValueChange: (value: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-lg">{label}</Label>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => onValueChange(Math.max(0, value - 1))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="font-bold text-lg w-8 text-center">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => onValueChange(value + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Step4_FloorPlan({ setFormData, formData }: Step4Props) {

  const handleCounterChange = (key: string, value: number) => {
    setFormData({ [key]: value });
  };
  
  const handleCheckboxChange = (id: string, checked: boolean) => {
    const current = formData.whoElse || [];
    const updated = checked ? [...current, id] : current.filter((item: string) => item !== id);
    setFormData({ whoElse: updated });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Share some basics about your place</h2>
      <p className="text-muted-foreground mb-8">You'll add more details later.</p>

      <div className="space-y-8">
        <Counter
          label="Guests"
          value={formData.maxGuests || 1}
          onValueChange={(val) => handleCounterChange('maxGuests', val)}
        />
        <Counter
          label="Bedrooms"
          value={formData.bedrooms || 0}
          onValueChange={(val) => handleCounterChange('bedrooms', val)}
        />
        <Counter
          label="Beds"
          value={formData.beds || 1}
          onValueChange={(val) => handleCounterChange('beds', val)}
        />
        <Counter
          label="Bathrooms"
          value={formData.bathrooms || 1}
          onValueChange={(val) => handleCounterChange('bathrooms', val)}
        />
      </div>
      
      <div className="mt-12">
        <h3 className="text-xl font-semibold mb-4">What type of bathroom?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bathroomTypes.map(item => (
                <Button 
                    key={item.id} 
                    type="button"
                    variant={formData.bathroomType === item.id ? "default" : "outline"}
                    onClick={() => setFormData({ bathroomType: item.id })}
                    className="h-auto py-4 text-left whitespace-normal"
                >
                    {item.label}
                </Button>
            ))}
        </div>
      </div>
      
      <div className="mt-12">
        <h3 className="text-xl font-semibold mb-4">Who else might be there?</h3>
        <p className="text-muted-foreground mb-4">This helps guests know what to expect.</p>
         <div className="space-y-3">
              {whoElseOptions.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={item.id}
                    checked={formData.whoElse?.includes(item.id)}
                    onCheckedChange={(checked) => handleCheckboxChange(item.id, !!checked)}
                  />
                  <label htmlFor={item.id} className="text-sm font-medium leading-none">
                    {item.label}
                  </label>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
