import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

export interface User {
  id: string;
  name: string;
  avatarId: string;
}

export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Amenity {
  name: string;
  icon: any; // Lucide icon component
}

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
  hostId: string;
  imageId: string;
}

export const mockUsers: User[] = [
  { id: 'user-1', name: 'Sarah Lee', avatarId: 'avatar-1' },
  { id: 'user-2', name: 'Mike Johnson', avatarId: 'avatar-2' },
  { id: 'user-3', name: 'Emily Chen', avatarId: 'avatar-3' },
  { id: 'user-4', name: 'David Rodriguez', avatarId: 'avatar-4' },
];

export const mockProperties: Property[] = [
  {
    id: 'prop-1',
    title: 'Cozy Forest Cabin',
    location: 'Asheville, North Carolina',
    pricePerNight: 125,
    rating: 4.9,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    description: 'Escape to our cozy cabin in the heart of the Blue Ridge Mountains. Perfect for a romantic getaway or a small family vacation. Enjoy the fresh mountain air from the spacious deck.',
    amenities: ['Wifi', 'Kitchen', 'Free parking', 'Heating', 'TV'],
    hostId: 'user-1',
    imageId: 'property-1',
  },
  {
    id: 'prop-2',
    title: 'Modern City Apartment',
    location: 'New York, New York',
    pricePerNight: 250,
    rating: 4.8,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    description: 'Live like a local in our stylish and modern apartment in the vibrant East Village. Steps away from the city\'s best restaurants, bars, and shops.',
    amenities: ['Wifi', 'Kitchen', 'Air conditioning', 'Elevator', 'TV'],
    hostId: 'user-2',
    imageId: 'property-2',
  },
  {
    id: 'prop-3',
    title: 'Luxury Beach House',
    location: 'Malibu, California',
    pricePerNight: 750,
    rating: 5.0,
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 4,
    description: 'Experience the ultimate luxury in our stunning Malibu beach house. With breathtaking ocean views, a private pool, and direct beach access, this is the perfect place to unwind.',
    amenities: ['Wifi', 'Kitchen', 'Pool', 'Air conditioning', 'TV', 'Free parking'],
    hostId: 'user-3',
    imageId: 'property-3',
  },
  {
    id: 'prop-4',
    title: 'Charming Countryside Farmhouse',
    location: 'Provence, France',
    pricePerNight: 200,
    rating: 4.9,
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    description: 'Immerse yourself in the charm of Provence at our beautifully restored farmhouse. Surrounded by lavender fields and vineyards, it\'s the perfect base for exploring the region.',
    amenities: ['Wifi', 'Kitchen', 'Pool', 'Free parking', 'Heating'],
    hostId: 'user-4',
    imageId: 'property-4',
  },
    {
    id: 'prop-5',
    title: 'Stylish Downtown Loft',
    location: 'Chicago, Illinois',
    pricePerNight: 180,
    rating: 4.7,
    maxGuests: 3,
    bedrooms: 1,
    bathrooms: 1,
    description: 'A trendy loft in the heart of Chicago with exposed brick and industrial-chic decor. The perfect urban retreat for solo travelers or couples.',
    amenities: ['Wifi', 'Kitchen', 'Air conditioning', 'Elevator', 'TV'],
    hostId: 'user-1',
    imageId: 'property-5',
  },
  {
    id: 'prop-6',
    title: 'Serene Villa with Private Pool',
    location: 'Bali, Indonesia',
    pricePerNight: 350,
    rating: 4.9,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    description: 'Find your zen in this peaceful Balinese villa. Features a private pool, lush gardens, and open-air living spaces for a truly tropical experience.',
    amenities: ['Wifi', 'Kitchen', 'Pool', 'Air conditioning', 'Free parking'],
    hostId: 'user-2',
    imageId: 'property-6',
  },
  {
    id: 'prop-7',
    title: 'Downtown Penthouse',
    location: 'Toronto, Canada',
    pricePerNight: 400,
    rating: 4.8,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    description: 'Spectacular panoramic views of the Toronto skyline from this luxurious penthouse. Modern amenities and a central location make this an unforgettable stay.',
    amenities: ['Wifi', 'Kitchen', 'Air conditioning', 'Gym', 'Pool'],
    hostId: 'user-3',
    imageId: 'property-7',
  },
  {
    id: 'prop-8',
    title: 'Quiet Suburban Home',
    location: 'Austin, Texas',
    pricePerNight: 160,
    rating: 4.6,
    maxGuests: 5,
    bedrooms: 3,
    bathrooms: 2,
    description: 'A comfortable and spacious home in a quiet Austin suburb. Perfect for families, with a large backyard and easy access to city attractions.',
    amenities: ['Wifi', 'Kitchen', 'Free parking', 'Air conditioning', 'TV'],
    hostId: 'user-4',
    imageId: 'property-8',
  },
];

export const mockReviews: Review[] = [
  { id: 'rev-1', propertyId: 'prop-1', userId: 'user-2', rating: 5, comment: 'Absolutely loved our stay! The cabin was perfect and the location was so peaceful. Highly recommend.', date: '2023-10-15' },
  { id: 'rev-2', propertyId: 'prop-1', userId: 'user-3', rating: 4, comment: 'A wonderful getaway. The cabin was clean and well-equipped. The host was very responsive.', date: '2023-09-22' },
  { id: 'rev-3', propertyId: 'prop-2', userId: 'user-4', rating: 5, comment: 'The apartment is in a fantastic location. So many great places to eat and explore right at your doorstep.', date: '2023-11-01' },
  { id: 'rev-4', propertyId: 'prop-3', userId: 'user-1', rating: 5, comment: 'Words can\'t describe how beautiful this place is. Waking up to the sound of the ocean was a dream. Worth every penny.', date: '2023-08-10' },
  { id: 'rev-5', propertyId: 'prop-4', userId: 'user-2', rating: 5, comment: 'A truly authentic Provençal experience. The farmhouse is even more beautiful than in the pictures.', date: '2023-07-20' },
];

export const findUserById = (userId: string) => mockUsers.find(user => user.id === userId);
export const findPropertyById = (propertyId: string) => mockProperties.find(prop => prop.id === propertyId);
export const findReviewsByPropertyId = (propertyId: string) => mockReviews.filter(review => review.propertyId === propertyId);
export const findImageById = (imageId: string) => PlaceHolderImages.find(img => img.id === imageId);
