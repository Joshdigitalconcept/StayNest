'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

/**
 * This route group was causing conflicts. 
 * We are redirecting to the explicit /admin dashboard.
 */
export default function AdminRootRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.push('/admin');
  }, [router]);
  return null;
}
