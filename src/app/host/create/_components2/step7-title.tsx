'use client';

import { Input } from "@/components/ui/input";

interface Step7Props {
  setFormData: (data: any) => void;
  formData: any;
}

export default function Step7_Title({ setFormData, formData }: Step7Props) {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Now, let's give your place a title</h2>
      <p className="text-muted-foreground mb-8">Short titles work best. Have fun with it—you can always change it later.</p>

      <Input
        type="text"
        placeholder="e.g., Cozy Cabin in the Woods"
        value={formData.title || ''}
        onChange={(e) => setFormData({ title: e.target.value })}
        maxLength={50}
        className="text-lg p-6"
      />
    </div>
  );
}
