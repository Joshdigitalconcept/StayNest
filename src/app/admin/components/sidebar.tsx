
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, BookCopy, CreditCard, Star, ShieldAlert, FileText, BarChart3, Settings, Send, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const mainNav = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/listings', label: 'Listings', icon: Briefcase },
  { href: '/admin/bookings', label: 'Bookings', icon: BookCopy },
];

const secondaryNav = [
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/payouts', label: 'Payouts & Reports', icon: TrendingUp },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/disputes', label: 'Disputes & Support', icon: ShieldAlert },
  { href: '/admin/notifications', label: 'Notifications', icon: Send },
];

const platformNav = [
    { href: '/admin/trust-safety', label: 'Trust & Safety', icon: ShieldAlert },
    { href: '/admin/content', label: 'Content & Policies', icon: FileText },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings & Roles', icon: Settings },
    { href: '/admin/health', label: 'System Health', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();

  const renderNav = (items: typeof mainNav, title: string) => (
     <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">{title}</h2>
        <div className="space-y-1">
             {items.map((item) => (
                <Link
                key={item.href}
                href={item.href}
                className={cn(
                    'flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                    pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )}
                >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
                </Link>
            ))}
        </div>
     </div>
  )

  return (
    <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/admin" className="flex items-center gap-2 font-semibold">
                    <ShieldAlert className="h-6 w-6 text-primary" />
                    <span className="">Admin Panel</span>
                </Link>
            </div>
            <div className="flex-1">
                <nav className="grid items-start text-sm font-medium">
                   {renderNav(mainNav, 'Core')}
                   <Separator className="my-2" />
                   {renderNav(secondaryNav, 'Operations')}
                   <Separator className="my-2" />
                   {renderNav(platformNav, 'Platform')}
                </nav>
            </div>
        </div>
    </div>
  );
}
