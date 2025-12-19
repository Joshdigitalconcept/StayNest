import type { Timestamp } from 'firebase/firestore';

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
  imageUrls?: string[]; // For carousel
  cleaningFee: number;
  serviceFee: number;
  createdAt: any;
  updatedAt: any;
}

export interface Booking {
  id: string;
  listingId: string;
  guestId: string;
  hostId: string;
  checkInDate: Timestamp;
  checkOutDate: Timestamp;
  totalPrice: number;
  guests: number;
  status: 'pending' | 'confirmed' | 'declined';
  createdAt: Timestamp;
  // Denormalized data for easier display
  listing?: {
    id: string; // Add the id here
    title: string;
    location: string;
    imageUrl: string;
  };
}
