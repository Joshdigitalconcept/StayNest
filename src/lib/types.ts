export interface Property {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  rating: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  amenities: string[];
  ownerId: string;
  imageUrl: string;
  createdAt: any;
  updatedAt: any;
}
