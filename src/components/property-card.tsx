import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import type { Property } from "@/lib/placeholder-data";
import { findImageById } from "@/lib/placeholder-data";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const image = findImageById(property.imageId);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-xl">
      <Link href={`/properties/${property.id}`} className="block">
        <div className="relative h-48 w-full">
          {image && (
            <Image
              src={image.imageUrl}
              alt={property.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              data-ai-hint={image.imageHint}
            />
          )}
          <Badge className="absolute top-2 right-2 flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>{property.rating.toFixed(1)}</span>
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg truncate">{property.title}</h3>
          <p className="text-muted-foreground text-sm truncate">{property.location}</p>
          <div className="mt-2 flex items-baseline">
            <p className="font-bold text-lg">${property.pricePerNight}</p>
            <span className="text-muted-foreground text-sm ml-1">/ night</span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
