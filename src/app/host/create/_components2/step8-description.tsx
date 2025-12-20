'use client';

import { Textarea } from "@/components/ui/textarea";

interface Step8Props {
  setFormData: (data: any) => void;
  formData: any;
}

export default function Step8_Description({ setFormData, formData }: Step8Props) {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Create your description</h2>
      <p className="text-muted-foreground mb-8">Share what makes your place special.</p>

      <Textarea
        placeholder="Describe your property, its unique features, and the neighborhood."
        value={formData.description || ''}
        onChange={(e) => setFormData({ description: e.target.value })}
        rows={8}
        className="text-base p-4"
      />
    </div>
  );
}
