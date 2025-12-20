'use client';

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Step9Props {
  setFormData: (data: any) => void;
  formData: any;
}

export default function Step9_Booking({ setFormData, formData }: Step9Props) {
  const bookingSettings = formData.bookingSettings;
  const firstGuestWelcome = formData.firstGuestWelcome;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Choose your booking settings</h2>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">How you'll confirm bookings</h3>
          <RadioGroup
            value={bookingSettings}
            onValueChange={(value) => setFormData({ bookingSettings: value })}
            className="space-y-4"
          >
             <Label htmlFor="instant" className="block">
                <Card className={`p-6 cursor-pointer hover:border-primary ${bookingSettings === 'instant' ? 'border-primary ring-2 ring-primary' : ''}`}>
                    <div className="flex items-start space-x-4">
                        <RadioGroupItem value="instant" id="instant" className="mt-1"/>
                        <div>
                            <p className="font-semibold">Use Instant Book</p>
                            <p className="text-sm text-muted-foreground">Guests can book automatically.</p>
                        </div>
                    </div>
                </Card>
            </Label>
             <Label htmlFor="approval" className="block">
                <Card className={`p-6 cursor-pointer hover:border-primary ${bookingSettings === 'approval' ? 'border-primary ring-2 ring-primary' : ''}`}>
                    <div className="flex items-start space-x-4">
                        <RadioGroupItem value="approval" id="approval" className="mt-1" />
                         <div>
                            <p className="font-semibold">Approve or decline requests</p>
                            <p className="text-sm text-muted-foreground">Guests must ask if they can book.</p>
                        </div>
                    </div>
                </Card>
            </Label>
          </RadioGroup>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Who to welcome for your first reservation</h3>
          <RadioGroup
            value={firstGuestWelcome}
            onValueChange={(value) => setFormData({ firstGuestWelcome: value })}
            className="space-y-4"
          >
             <Label htmlFor="any" className="block">
                <Card className={`p-6 cursor-pointer hover:border-primary ${firstGuestWelcome === 'any' ? 'border-primary ring-2 ring-primary' : ''}`}>
                    <div className="flex items-start space-x-4">
                        <RadioGroupItem value="any" id="any" className="mt-1"/>
                        <div>
                            <p className="font-semibold">Any StayNest guest</p>
                            <p className="text-sm text-muted-foreground">Get the widest pool of potential guests.</p>
                        </div>
                    </div>
                </Card>
            </Label>
             <Label htmlFor="experienced" className="block">
                <Card className={`p-6 cursor-pointer hover:border-primary ${firstGuestWelcome === 'experienced' ? 'border-primary ring-2 ring-primary' : ''}`}>
                    <div className="flex items-start space-x-4">
                        <RadioGroupItem value="experienced" id="experienced" className="mt-1"/>
                        <div>
                            <p className="font-semibold">An experienced guest</p>
                            <p className="text-sm text-muted-foreground">For guests with a good track record on StayNest.</p>
                        </div>
                    </div>
                </Card>
            </Label>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
