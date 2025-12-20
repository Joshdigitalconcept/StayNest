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
  reviewCount?: number;
  host?: {
    name: string | null;
    photoURL: string | null;
  };
  // New fields for host flow
  propertyType?: string;
  guestSpace?: string;
  beds?: number;
  bathroomType?: string;
  whoElse?: string[];
  bookingSettings?: 'instant' | 'approval';
  firstGuestWelcome?: 'any' | 'experienced';
  weekendPrice?: number;
  newListingPromotion?: boolean;
  weeklyDiscount?: boolean;
  monthlyDiscount?: boolean;
  lastMinuteDiscount?: boolean;
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

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
  favorites?: string[];
  isHost?: boolean;
}

export interface Favorite {
    id: string;
    listing: Property;
}

export interface Review {
  id:string;
  listingId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
  user: {
    name: string | null;
    photoURL: string | null;
  };
}

// Data for the host creation form
export const propertyTypes = [
  { id: 'house', label: 'House', icon: 'Home' },
  { id: 'apartment', label: 'Apartment', icon: 'Building' },
  { id: 'guesthouse', label: 'Guesthouse', icon: 'Hotel' },
  { id: 'hotel', label: 'Hotel', icon: 'Building2' },
  { id: 'cabin', label: 'Cabin', icon: 'LogCabin' },
  { id: 'treehouse', label: 'Treehouse', icon: 'Trees' },
];

export const guestSpaces = [
    { id: 'entire', label: 'An entire place' },
    { id: 'private', label: 'A private room' },
    { id: 'shared', label: 'A shared room' },
];

export const bathroomTypes = [
    { id: 'private', label: 'Private and attached' },
    { id: 'dedicated', label: 'Dedicated' },
    { id: 'shared', label: 'Shared' },
];

export const amenitiesList = [
  "Wifi", "Kitchen", "Free parking", "Heating", "TV", "Air conditioning", "Pool", "Elevator", "Gym",
  "Washer", "Dryer", "Iron", "Hair dryer", "Crib", "High chair", "Workspace", "Self check-in", "Pets allowed"
];

export const whoElseOptions = [
    { id: 'me', label: 'Me (the host)' },
    { id: 'family', label: 'My family' },
    { id: 'roommates', label: 'Roommates' },
    { id: 'other_guests', label: 'Other guests' },
];
