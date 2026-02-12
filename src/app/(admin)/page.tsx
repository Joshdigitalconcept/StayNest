
import { redirect } from 'next/navigation';

/**
 * Pure server-side redirect to the primary admin dashboard.
 * Minimal component to prevent build-time manifest conflicts.
 */
export default function AdminRootRedirect() {
  redirect('/admin');
  return null;
}
