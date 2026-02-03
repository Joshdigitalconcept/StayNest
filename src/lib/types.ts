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
  imageUrls: string[];
  cleaningFee: number;
  serviceFee: number;
  createdAt: any;
  updatedAt: any;
  reviewCount: number;
  host: {
    name: string | null;
    photoURL: string | null;
  };
  // New fields from host flow
  propertyType: string;
  guestSpace: string;
  beds: number;
  bathroomType: string;
  whoElse: string[];
  bookingSettings: 'instant' | 'approval';
  firstGuestWelcome: 'any' | 'experienced';
  weekendPrice: number;
  newListingPromotion: boolean;
  weeklyDiscount: boolean;
  monthlyDiscount: boolean;
  lastMinuteDiscount: boolean;
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
   // Denormalized user data
  guest?: {
    name: string;
    photoURL: string;
  };
  host?: {
    name: string;
    photoURL: string;
  }
}

export type AdminRole = 'users' | 'listings' | 'content' | 'finance' | 'support' | 'super_admin';

export interface AdminRecord {
  id: string;
  name: string;
  email: string;
  roles: AdminRole[];
  isSuperAdmin: boolean;
  grantedAt: Timestamp;
  by: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  signInProvider?: string; // e.g., 'password', 'google.com'
  emailVerified?: boolean;
  phoneVerified?: boolean; // New
  idVerified?: boolean; // New
  createdAt: Timestamp;
  lastActive?: Timestamp; // New
  accountStatus?: 'active' | 'suspended' | 'banned'; // New
  profilePictureUrl?: string;
  favorites?: string[];
  isHost?: boolean;
  isGuest?: boolean;
  // New detailed profile fields
  work?: string;
  school?: string;
  live?: string;
  about?: string;
  languages?: string;
  born?: string;
  obsessedWith?: string;
  uselessSkill?: string;
  biographyTitle?: string;
  favoriteSong?: string;
  spendTooMuchTime?: string;
  funFact?: string;
  pets?: string;
  travelGoal?: string;
  residentialAddress?: {
    country: string;
    street: string;
    apt: string;
    city: string;
    state: string;
    postalCode: string;
  }
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


export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  receiverId: string;
  guestId: string;
  hostId: string;
  listingId: string;
  text: string;
  createdAt: Timestamp;
  isRead: boolean;
}


// Data for the host creation form
export const propertyTypes = [
  { id: 'house', label: 'House', icon: 'Home' },
  { id: 'apartment', label: 'Apartment', icon: 'Building' },
  { id: 'guesthouse', label: 'Guesthouse', icon: 'Hotel' },
  { id: 'hotel', label: 'Hotel', icon: 'Building2' },
  { id: 'cabin', label: 'Cabin', icon: 'Mountain' },
  { id: 'treehouse', label: 'Treehouse', icon: 'Trees' },
];

export const guestSpaces = [
    { id: 'entire', label: 'An entire place' },
    { id: 'private', label: 'A private room' },
    { id: 'shared', label: 'A shared room' },
];

export const bathroomTypes = [
    { id: 'private', label: 'Private and attached', description: "This bathroom is exclusively for the guest and is connected directly to their room." },
    { id: 'dedicated', label: 'Dedicated', description: "This bathroom is exclusively for the guest, but it's accessed from a shared space like a hallway." },
    { id: 'shared', label: 'Shared', description: "This bathroom is used by the guest as well as the host or other people." },
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

export const ADMIN_ROLES_LIST = [
  { id: 'users', label: 'User Management', description: 'Suspend, ban, and verify users.' },
  { id: 'listings', label: 'Listing Management', description: 'Moderate and delete property listings.' },
  { id: 'content', label: 'Content & Policies', description: 'Edit TOS, Privacy, and Help articles.' },
  { id: 'finance', label: 'Finance & Payouts', description: 'View payment history and revenue.' },
  { id: 'support', label: 'Disputes & Support', description: 'Manage and resolve support tickets.' },
] as const;
