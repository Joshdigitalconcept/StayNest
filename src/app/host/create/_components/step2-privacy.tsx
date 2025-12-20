'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { guestSpaces } from "@/lib/types";

interface Step2Props {
  setFormData: (data: any) => void;
  formData: any;
}

export default function Step2_Privacy({ setFormData, formData }: Step2Props) {
  const selectedSpace = formData.guestSpace;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">What type of place will guests have?</h2>
      <p className="text-muted-foreground mb-8">This helps guests understand the privacy level of your listing.</p>
      
      <RadioGroup
        value={selectedSpace}
        onValueChange={(value) => setFormData({ guestSpace: value })}
        className="space-y-4"
      >
        {guestSpaces.map((space) => (
          <Label key={space.id} htmlFor={space.id}>
            <Card className={`p-6 cursor-pointer hover:border-primary ${selectedSpace === space.id ? 'border-primary ring-2 ring-primary' : ''}`}>
              <div className="flex items-center space-x-4">
                <RadioGroupItem value={space.id} id={space.id} />
                <span className="font-semibold">{space.label}</span>
              </div>
            </Card>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}
