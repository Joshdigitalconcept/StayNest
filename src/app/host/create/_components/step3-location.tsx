'use client';

import { Input } from "@/components/ui/input";

interface Step3Props {
  setFormData: (data: any) => void;
  formData: any;
}

export default function Step3_Location({ setFormData, formData }: Step3Props) {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Where's your place located?</h2>
      <p className="text-muted-foreground mb-8">Guests will only get your exact address after they’ve booked a reservation.</p>

      <Input
        type="text"
        placeholder="e.g. Lagos, Abuja, Port Harcourt, or Ibadan"
        value={formData.location || ''}
        onChange={(e) => setFormData({ location: e.target.value })}
        className="text-lg p-6"
      />
      <p className="text-sm text-muted-foreground mt-4 italic">Currently optimized for stays within Nigeria.</p>
    </div>
  );
}
