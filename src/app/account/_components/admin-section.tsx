// This component is no longer needed and can be deleted.
// The functionality is now part of the dedicated /admin routes.
export function AdminSection({ isAdmin }: { isAdmin: boolean }) {
  if (!isAdmin) {
    return null;
  }
  return null;
}
