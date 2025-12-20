'use client';

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const discounts = [
  { id: 'newListingPromotion', label: 'New listing promotion', description: 'Offer 20% off your first 3 bookings to get reviews faster.', percentage: 20 },
  { id: 'lastMinuteDiscount', label: 'Last-minute discount', description: 'For stays booked 14 days or less before arrival.', percentage: 12 },
  { id: 'weeklyDiscount', label: 'Weekly discount', description: 'For stays of 7 nights or more.', percentage: 5 },
  { id: 'monthlyDiscount', label: 'Monthly discount', description: 'For stays of 28 nights or more.', percentage: 10 },
];

interface Step11Props {
  setFormData: (data: any) => void;
  formData: any;
}

export default function Step11_Discounts({ setFormData, formData }: Step11Props) {
  const handleDiscountChange = (id: string, checked: boolean) => {
    setFormData({ [id]: checked });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Add discounts</h2>
      <p className="text-muted-foreground mb-8">Help your place stand out to get booked faster. Only one discount will be applied per stay.</p>

      <div className="space-y-4">
        {discounts.map(discount => (
          <div key={discount.id} className="flex items-start space-x-4 p-4 border rounded-lg">
            <Checkbox
              id={discount.id}
              checked={!!formData[discount.id]}
              onCheckedChange={(checked) => handleDiscountChange(discount.id, !!checked)}
              className="mt-1"
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor={discount.id} className="text-base font-semibold cursor-pointer">
                {discount.label}
              </Label>
              <p className="text-sm text-muted-foreground">{discount.description}</p>
            </div>
            <div className="ml-auto font-bold text-lg">{discount.percentage}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
