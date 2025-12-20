'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { propertyTypes } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LucideIcon, Home, Building, Hotel, Building2, LogCabin, Trees } from "lucide-react";
import * as React from 'react';

const icons: { [key: string]: LucideIcon } = {
  Home, Building, Hotel, Building2, LogCabin, Trees
};


interface Step1Props {
  setFormData: (data: any) => void;
  formData: any;
}

export default function Step1_Structure({ setFormData, formData }: Step1Props) {
  const selectedType = formData.propertyType;

  const handleSelect = (typeId: string) => {
    setFormData({ propertyType: typeId });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2">Which of these best describes your place?</h2>
      <p className="text-muted-foreground mb-8">Pick a category that fits your property.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {propertyTypes.map((type) => {
          const Icon = icons[type.icon];
          return (
            <Card
              key={type.id}
              onClick={() => handleSelect(type.id)}
              className={cn(
                "cursor-pointer hover:border-primary transition-colors",
                selectedType === type.id && "border-primary ring-2 ring-primary"
              )}
            >
              <CardContent className="p-6">
                {Icon && <Icon className="w-8 h-8 mb-2" />}
                <p className="font-semibold">{type.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
