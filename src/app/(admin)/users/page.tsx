import { redirect } from 'next/navigation';

export const dynamic = 'force-static';

export default function AdminUsersRedirect() {
  // Pure server-side redirect to avoid client manifest issues
  redirect('/admin/users');
}
