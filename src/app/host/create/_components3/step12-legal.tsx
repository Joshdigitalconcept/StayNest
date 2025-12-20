'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Step12Props {
  setFormData: (data: any) => void;
  formData: any;
}

export default function Step12_Legal({ setFormData, formData }: Step12Props) {
  const handleAddressChange = (key: string, value: string) => {
    setFormData({
      residentialAddress: {
        ...formData.residentialAddress,
        [key]: value
      }
    });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Provide a few final details</h2>
      <p className="text-muted-foreground mb-8">This is required to comply with financial regulations and helps us prevent fraud. Guests won’t see this information.</p>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">What’s your residential address?</h3>
          <div className="space-y-4">
            <Input placeholder="Country / Region" value={formData.residentialAddress?.country || ''} onChange={(e) => handleAddressChange('country', e.target.value)} />
            <Input placeholder="Street address" value={formData.residentialAddress?.street || ''} onChange={(e) => handleAddressChange('street', e.target.value)} />
            <Input placeholder="Apt, floor, bldg (if applicable)" value={formData.residentialAddress?.apt || ''} onChange={(e) => handleAddressChange('apt', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="City / town / village" value={formData.residentialAddress?.city || ''} onChange={(e) => handleAddressChange('city', e.target.value)} />
              <Input placeholder="Province / state" value={formData.residentialAddress?.state || ''} onChange={(e) => handleAddressChange('state', e.target.value)} />
            </div>
            <Input placeholder="Postal code (if applicable)" value={formData.residentialAddress?.postalCode || ''} onChange={(e) => handleAddressChange('postalCode', e.target.value)} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Are you hosting as a business?</h3>
          <p className="text-sm text-muted-foreground mb-4">This means your business is most likely registered with your state or government.</p>
          <RadioGroup
            value={formData.hostingAsBusiness}
            onValueChange={(value) => setFormData({ hostingAsBusiness: value })}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="business-yes" />
              <Label htmlFor="business-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="business-no" />
              <Label htmlFor="business-no">No</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
