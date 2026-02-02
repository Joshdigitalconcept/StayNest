import * as React from 'react';

/**
 * Minimal server-only layout for the proxy group.
 * Avoiding client-side logic here prevents build-time manifest conflicts.
 */
export default function AdminGroupProxyLayout({ children }: { children: React.ReactNode }) {
  return <React.Fragment>{children}</React.Fragment>;
}
