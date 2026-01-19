# StayNest

This is a NextJS starter in Firebase Studio.

## Development Summary & Current Status

### Features Implemented
*   **User Authentication**: Full email/password and Google sign-in/sign-up flows.
*   **Property Listings**: Multi-step "Become a Host" flow for creating detailed property listings.
*   **Core User Experience**: Homepage with featured listings, detailed property pages, and a search/booking system.
*   **User Profiles**: Dedicated pages for users to manage their profile information, view their bookings ("My Bookings"), and manage their properties ("My Properties").
*   **Admin Panel**: A secure, role-based admin dashboard accessible only to users with an "admin" role in the `roles_admin` Firestore collection. The panel allows for viewing users, listings, and bookings.

### Key Challenges & Resolutions
The primary challenge throughout development was a recurring "Missing or insufficient permissions" error from Firestore. This was caused by incorrect or overly restrictive security rules that conflicted with the application's data-fetching queries.

After multiple iterations, this issue has been resolved by implementing a robust and secure `firestore.rules` file that correctly handles permissions for regular users, hosts, and administrators across all data collections. The application is now stable and the core features are functional.
