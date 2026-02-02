import { redirect } from 'next/navigation';

export const dynamic = 'force-static';

/**
 * Pure server-side redirect to the primary admin dashboard.
 */
export default function AdminRootRedirect() {
  redirect('/admin');
  return null;
}
