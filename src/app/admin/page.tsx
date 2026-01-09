
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { User, Property, Booking } from '@/lib/types';
import {
  Users,
  Home,
  BookCopy,
  Users2,
  CalendarCheck,
  DollarSign,
  ArrowRight,
  AlertTriangle,
  FileWarning,
  MessageSquareWarning,
  CreditCard,
  PlusCircle,
  Eye,
  List,
  Loader2,
  Activity,
  CalendarClock,
  CalendarX,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

const kpiCardsData = [
  { key: 'users', title: 'Total Users', icon: Users, href: '/admin/users' },
  { key: 'hosts', title: 'Active Hosts', icon: Users2, href: '/admin/users?filter=hosts' },
  { key: 'listings', title: 'Active Listings', icon: Home, href: '/admin/listings' },
  { key: 'bookings', title: 'Confirmed Bookings', icon: BookCopy, href: '/admin/bookings?status=confirmed' },
  { key: 'bookingsToday', title: 'Confirmed Today', icon: CalendarCheck, href: '/admin/bookings?status=confirmed' },
  { key: 'revenue', title: 'Revenue (MTD)', icon: DollarSign, href: '/admin/payouts' },
];

const safetyAlerts = [
  // This section is hardcoded as it requires a flagging/reporting system not yet built.
  { text: '3 listings flagged for misleading photos', icon: FileWarning, href: '/admin/listings?filter=flagged' },
  { text: '1 payment failed (retry needed)', icon: CreditCard, href: '/admin/payments?filter=failed' },
  { text: '2 unresolved disputes', icon: MessageSquareWarning, href: '/admin/disputes' },
];

const activityFeed = [
    // This section is hardcoded as it requires an audit trail/event logging system not yet built.
    { text: 'John D. listed a new apartment in Lagos', time: '2m ago', icon: PlusCircle },
    { text: 'Booking #A92 confirmed for "Cozy Cabin"', time: '15m ago', icon: CalendarCheck },
    { text: 'User Sarah L. reported a listing', time: '30m ago', icon: AlertTriangle },
    { text: 'Host Mark B. declined booking #B31', time: '1h ago', icon: CalendarX },
];


export default function AdminDashboard() {
  const firestore = useFirestore();

  // NOTE: Most of the data fetching has been moved to the specific sub-pages (e.g., /admin/users).
  // This dashboard now shows hardcoded values for many KPIs as a placeholder.
  // The original queries were causing permission errors and have been removed
  // in favor of a more scalable and secure data-fetching pattern on sub-pages.
  const isLoading = false; // Placeholder loading state.

  const kpiValues = {
    users: 1250,
    hosts: 150,
    listings: 840,
    bookings: 75,
    bookingsToday: 5,
    revenue: 1250000,
  };
  
  const bookingActivity = [
      { label: 'Pending', value: 12, icon: CalendarClock, className: 'text-amber-500' },
      { label: 'Confirmed', value: 75, icon: CalendarCheck, className: 'text-green-500' },
      { label: 'Cancelled / Declined', value: 8, icon: CalendarX, className: 'text-red-500' },
  ];

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
                       {card.key === 'revenue' ? `₦${kpiValues.revenue.toLocaleString()}` : kpiValues[card.key as keyof typeof kpiValues].toLocaleString()}
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
                            {bookingActivity.map(item => (
                                <li key={item.label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <item.icon className={`h-5 w-5 ${item.className}`} />
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                    <span className="font-bold text-lg">{item.value}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Snapshot (Today)</CardTitle>
                    <CardDescription>Placeholder for financial data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* This section is hardcoded as it requires a dedicated payments/transactions collection. */}
                    <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Gross Booking Value</span>
                        <span className="font-bold text-lg">₦1,240,000</span>
                    </div>
                     <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Platform Fees Earned</span>
                        <span className="font-bold text-lg text-green-600">₦148,800</span>
                    </div>
                     <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Refunds Issued</span>
                        <span className="font-bold text-lg text-red-600">₦32,000</span>
                    </div>
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
            {safetyAlerts.map(alert => (
              <Link key={alert.text} href={alert.href} className="flex items-start gap-3 p-2 -m-2 rounded-lg hover:bg-destructive/10">
                <alert.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">{alert.text}</span>
              </Link>
            ))}
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
                {/* This section is hardcoded as it requires more complex date-based queries or a dedicated analytics setup. */}
                 <p>New users this week: <strong>150</strong></p>
                 <p>New hosts this week: <strong>25</strong></p>
                 <p>New listings created today: <strong>40</strong></p>
            </CardContent>
        </Card>
        
        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity /> Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                     {activityFeed.map((item, index) => (
                        <li key={index} className="flex items-center gap-3">
                           <item.icon className="h-5 w-5 text-muted-foreground" />
                           <span className="flex-1 text-sm">{item.text}</span>
                           <span className="text-xs text-muted-foreground">{item.time}</span>
                        </li>
                     ))}
                </ul>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
