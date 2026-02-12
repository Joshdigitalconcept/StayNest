import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Removed the incorrect redirect to /admin/dashboard.
  // The Admin Dashboard is located at /admin/page.tsx.
  return NextResponse.next();
}

// Match all routes except for static files and APIs
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
