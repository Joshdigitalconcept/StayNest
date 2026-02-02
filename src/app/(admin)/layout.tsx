import * as React from 'react';

/**
 * Minimal layout for the route group to avoid build-time manifest errors.
 */
export default function AdminGroupProxyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
