
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  Home,
  BookCopy,
  Users2,
  CalendarCheck,
  DollarSign,
  AlertTriangle,
  FileWarning,
  MessageSquareWarning,
  Loader2,
  Activity,
  CalendarClock,
  CalendarX,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

const kpiCardsData = [
  { key: 'users', title: 'Total Users', icon: Users, href: '/admin/users' },
  { key: 'hosts', title: 'Active Hosts', icon: Users2, href: '/admin/users?filter=hosts' },
  { key: 'listings', title: 'Active Listings', icon: Home, href: '/admin/listings' },
  { key: 'bookings', title: 'Total Confirmed Bookings', icon: BookCopy, href: '/admin/bookings?status=confirmed' },
  { key: 'bookingsToday', title: 'Confirmed Today', icon: CalendarCheck, href: '/admin/bookings?status=confirmed' },
  { key: 'revenue', title: 'Revenue (MTD)', icon: DollarSign, href: '/admin/payouts' },
];

const safetyAlerts = [
  // This section is hardcoded as it requires a flagging/reporting system not yet built.
  { text: '3 listings flagged for misleading photos', icon: FileWarning, href: '/admin/listings?filter=flagged' },
  { text: '2 unresolved disputes', icon: MessageSquareWarning, href: '/admin/disputes' },
];

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = React.useState(true);

  // Simulate loading for a moment
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {kpiCardsData.map(card => (
          <Card key={card.key}>
             <Link href={card.href}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <div className="text-2xl font-bold">
                       ...
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    View Details
                  </p>
                </CardContent>
             </Link>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Booking Activity & Revenue */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card>
                <CardHeader>
                    <CardTitle>Booking Activity</CardTitle>
                    <CardDescription>Overview of booking statuses.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                         <ul className="space-y-4">
                            <li className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CalendarClock className="h-5 w-5 text-amber-500" />
                                    <span className="font-medium">Pending</span>
                                </div>
                                <span className="font-bold text-lg">...</span>
                            </li>
                             <li className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CalendarCheck className="h-5 w-5 text-green-500" />
                                    <span className="font-medium">Confirmed</span>
                                </div>
                                <span className="font-bold text-lg">...</span>
                            </li>
                             <li className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CalendarX className="h-5 w-5 text-red-500" />
                                    <span className="font-medium">Declined</span>
                                </div>
                                <span className="font-bold text-lg">...</span>
                            </li>
                        </ul>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Snapshot (Today)</CardTitle>
                    <CardDescription>Live financial data for today.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                        <>
                           <div className="flex justify-between items-baseline">
                                <span className="text-muted-foreground">Gross Booking Value</span>
                                <span className="font-bold text-lg">...</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-muted-foreground">Platform Fees Earned</span>
                                <span className="font-bold text-lg text-green-600">...</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-muted-foreground">Refunds Issued</span>
                                <span className="font-bold text-lg text-red-600">...</span>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Trust & Safety Alerts */}
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle /> Trust & Safety Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             <p className="text-sm text-muted-foreground p-4 text-center">No alerts. This requires a reporting system.</p>
          </CardContent>
        </Card>
      </div>
      
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         {/* User & Host Growth */}
         <Card>
            <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
                 <CardDescription>New user and listing activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <p>New users this week: <strong>...</strong></p>
                 <p>New hosts this week: <strong>...</strong></p>
                 <p>New listings created today: <strong>...</strong></p>
                 <p className="text-xs text-muted-foreground">Note: Real-time growth metrics require dedicated analytics setup.</p>
            </CardContent>
        </Card>
        
        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity /> Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-40">
                 <p className="text-sm text-muted-foreground">Live activity feed coming soon.</p>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
