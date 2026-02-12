import { redirect } from 'next/navigation';

export const dynamic = 'force-static';

export default function AdminListingsRedirect() {
  // Pure server-side redirect to avoid client manifest issues
  redirect('/admin/listings');
}
