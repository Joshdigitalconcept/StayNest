import * as React from 'react';

/**
 * Minimal server layout to prevent manifest conflicts.
 */
export default function AdminGroupProxyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
