import { redirect } from 'next/navigation';

export default function AdminBookingsRedirect() {
  redirect('/admin/bookings');
}
