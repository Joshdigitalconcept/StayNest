
'use client';

import Link from 'next/link';
import { Logo } from './logo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-6 w-6" />
              <span className="font-bold font-headline text-lg">StayNest</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find unique stays and unforgettable experiences around the world. Your next adventure starts here.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/search" className="hover:text-primary transition-colors">Find a Stay</Link></li>
              <li><Link href="/host/create" className="hover:text-primary transition-colors">Become a Host</Link></li>
              <li><Link href="/favorites" className="hover:text-primary transition-colors">Your Favorites</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/policies/help" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/policies/tos" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/policies/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Stay Connected</h4>
            <p className="text-xs text-muted-foreground">
              Questions? Contact our team 24/7 for assistance with your bookings or listings.
            </p>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {currentYear} StayNest Nigeria. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/policies/privacy" className="hover:underline">Privacy</Link>
            <Link href="/policies/tos" className="hover:underline">Terms</Link>
            <Link href="/policies/help" className="hover:underline">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
