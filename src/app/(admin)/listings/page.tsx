import { redirect } from 'next/navigation';

export const dynamic = 'force-static';

export default function AdminListingsRedirect() {
  redirect('/admin/listings');
  return null;
}
