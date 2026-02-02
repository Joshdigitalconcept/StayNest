import { redirect } from 'next/navigation';

/**
 * Server-side redirect to the consolidated admin dashboard.
 * This prevents manifest conflicts during Vercel builds.
 */
export default function AdminRootRedirect() {
  redirect('/admin');
}
