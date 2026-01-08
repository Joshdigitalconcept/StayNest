
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
  { key: 'hosts', title: 'Active Hosts', icon: Users2, href: '/admin/users' },
  { key: 'listings', title: 'Active Listings', icon: Home, href: '/admin/listings' },
  { key: 'bookings', title: 'Total Bookings', icon: BookCopy, href: '/admin/bookings' },
  { key: 'bookingsToday', title: 'Bookings Today', icon: CalendarCheck, href: '/admin/bookings' },
  { key: 'revenue', title: 'Revenue (MTD)', icon: DollarSign, href: '/admin/payouts' },
];

const safetyAlerts = [
  { text: '3 listings flagged for misleading photos', icon: FileWarning, href: '/admin/listings?filter=flagged' },
  { text: '1 payment failed (retry needed)', icon: CreditCard, href: '/admin/payments?filter=failed' },
  { text: '2 unresolved disputes', icon: MessageSquareWarning, href: '/admin/disputes' },
];

const activityFeed = [
    { text: 'John D. listed a new apartment in Lagos', time: '2m ago', icon: PlusCircle },
    { text: 'Booking #A92 confirmed for "Cozy Cabin"', time: '15m ago', icon: CalendarCheck },
    { text: 'User Sarah L. reported a listing', time: '30m ago', icon: AlertTriangle },
    { text: 'Host Mark B. declined booking #B31', time: '1h ago', icon: CalendarX },
];


export default function AdminDashboard() {
  const firestore = useFirestore();

  const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

  // Firestore Queries
  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const hostsQuery = useMemoFirebase(() => query(collection(firestore, 'users'), where('isHost', '==', true)), [firestore]);
  const listingsQuery = useMemoFirebase(() => collection(firestore, 'listings'), [firestore]);
  const bookingsQuery = useMemoFirebase(() => collection(firestore, 'bookings'), [firestore]);
  const bookingsTodayQuery = useMemoFirebase(() => query(collection(firestore, 'bookings'), where('createdAt', '>=', twentyFourHoursAgo)), [firestore, twentyFourHoursAgo]);
  const bookingsThisMonthQuery = useMemoFirebase(() => query(collection(firestore, 'bookings'), where('createdAt', '>=', startOfMonthTimestamp)), [firestore, startOfMonthTimestamp]);
  const pendingBookingsQuery = useMemoFirebase(() => query(collection(firestore, 'bookings'), where('status', '==', 'pending')), [firestore]);
  const confirmedBookingsQuery = useMemoFirebase(() => query(collection(firestore, 'bookings'), where('status', '==', 'confirmed')), [firestore]);
  const declinedBookingsQuery = useMemoFirebase(() => query(collection(firestore, 'bookings'), where('status', '==', 'declined')), [firestore]);

  // Data Hooks
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);
  const { data: hosts, isLoading: hostsLoading } = useCollection<User>(hostsQuery);
  const { data: listings, isLoading: listingsLoading } = useCollection<Property>(listingsQuery);
  const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsQuery);
  const { data: bookingsToday, isLoading: bookingsTodayLoading } = useCollection<Booking>(bookingsTodayQuery);
  const { data: bookingsThisMonth, isLoading: bookingsThisMonthLoading } = useCollection<Booking>(bookingsThisMonthQuery);
  const { data: pendingBookings, isLoading: pendingLoading } = useCollection<Booking>(pendingBookingsQuery);
  const { data: confirmedBookings, isLoading: confirmedLoading } = useCollection<Booking>(confirmedBookingsQuery);
  const { data: declinedBookings, isLoading: declinedLoading } = useCollection<Booking>(declinedBookingsQuery);
  
  const revenueThisMonth = React.useMemo(() => {
    return bookingsThisMonth?.reduce((sum, booking) => sum + booking.totalPrice, 0) ?? 0;
  }, [bookingsThisMonth]);

  const kpiValues = {
    users: users?.length ?? 0,
    hosts: hosts?.length ?? 0,
    listings: listings?.length ?? 0,
    bookings: bookings?.length ?? 0,
    bookingsToday: bookingsToday?.length ?? 0,
    revenue: revenueThisMonth,
  };
  
  const isLoading = usersLoading || hostsLoading || listingsLoading || bookingsLoading || pendingLoading || confirmedLoading || declinedLoading || bookingsTodayLoading || bookingsThisMonthLoading;
  
  const bookingActivity = [
      { label: 'Pending', value: pendingBookings?.length ?? 0, icon: CalendarClock, className: 'text-amber-500' },
      { label: 'Confirmed', value: confirmedBookings?.length ?? 0, icon: CalendarCheck, className: 'text-green-500' },
      { label: 'Cancelled / Declined', value: declinedBookings?.length ?? 0, icon: CalendarX, className: 'text-red-500' },
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
                    {/* Placeholder for % change */}
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
                {/* Placeholders */}
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
