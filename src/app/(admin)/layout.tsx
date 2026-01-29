'use client';

import * as React from 'react';

/**
 * This layout is redundant with src/app/admin/layout.tsx.
 * All admin logic is moved there to avoid duplicate route errors.
 */
export default function AdminGroupProxyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
