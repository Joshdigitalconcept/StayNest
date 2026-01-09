
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, getCountFromServer, getDocs } from 'firebase/firestore';
import type { User, Booking, Property } from '@/lib/types';
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
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { startOfMonth, startOfToday } from 'date-fns';

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

const activityFeed = [
    // This section is hardcoded as it requires an audit trail/event logging system not yet built.
    { text: 'John D. listed a new apartment in Lagos', time: '2m ago', icon: PlusCircle },
    { text: 'Booking #A92 confirmed for "Cozy Cabin"', time: '15m ago', icon: CalendarCheck },
    { text: 'User Sarah L. reported a listing', time: '30m ago', icon: AlertTriangle },
    { text: 'Host Mark B. declined booking #B31', time: '1h ago', icon: CalendarX },
];


export default function AdminDashboard() {
  const firestore = useFirestore();
  const [kpiValues, setKpiValues] = React.useState<any>({});
  const [bookingActivity, setBookingActivity] = React.useState<any[]>([]);
  const [revenueToday, setRevenueToday] = React.useState({ gross: 0, fees: 0, refunds: 0 });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!firestore) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // KPI Queries
        const usersCollection = collection(firestore, 'users');
        const hostsQuery = query(usersCollection, where('isHost', '==', true));
        const listingsCollection = collection(firestore, 'listings');
        const bookingsCollection = collection(firestore, 'bookings');
        
        const confirmedBookingsQuery = query(bookingsCollection, where('status', '==', 'confirmed'));
        const todayTimestamp = Timestamp.fromDate(startOfToday());
        const confirmedTodayQuery = query(confirmedBookingsQuery, where('createdAt', '>=', todayTimestamp));
        
        const monthStartTimestamp = Timestamp.fromDate(startOfMonth(new Date()));
        const revenueMtdQuery = query(confirmedBookingsQuery, where('createdAt', '>=', monthStartTimestamp));

        const [
            usersSnap,
            hostsSnap,
            listingsSnap,
            bookingsSnap,
            bookingsTodaySnap,
            revenueMtdSnap
        ] = await Promise.all([
            getCountFromServer(usersCollection),
            getCountFromServer(hostsQuery),
            getCountFromServer(listingsCollection),
            getCountFromServer(confirmedBookingsQuery),
            getCountFromServer(confirmedTodayQuery),
            getDocs(revenueMtdQuery)
        ]);
        
        const totalRevenueMtd = revenueMtdSnap.docs.reduce((sum, doc) => sum + (doc.data() as Booking).totalPrice, 0);

        // Booking Activity Queries
        const pendingQuery = query(bookingsCollection, where('status', '==', 'pending'));
        const declinedQuery = query(bookingsCollection, where('status', '==', 'declined'));
        
        const [pendingSnap, declinedSnap] = await Promise.all([
            getCountFromServer(pendingQuery),
            getCountFromServer(declinedQuery)
        ]);

        setKpiValues({
            users: usersSnap.data().count,
            hosts: hostsSnap.data().count,
            listings: listingsSnap.data().count,
            bookings: bookingsSnap.data().count,
            bookingsToday: bookingsTodaySnap.data().count,
            revenue: totalRevenueMtd,
        });

        setBookingActivity([
            { label: 'Pending', value: pendingSnap.data().count, icon: CalendarClock, className: 'text-amber-500' },
            { label: 'Confirmed', value: bookingsSnap.data().count, icon: CalendarCheck, className: 'text-green-500' },
            { label: 'Declined', value: declinedSnap.data().count, icon: CalendarX, className: 'text-red-500' },
        ]);
        
        // Revenue Today Query
        const confirmedTodayDocs = await getDocs(confirmedTodayQuery);
        const grossToday = confirmedTodayDocs.docs.reduce((sum, doc) => sum + (doc.data() as Booking).totalPrice, 0);
        // Assuming serviceFee is stored on the listing, not booking. This is a simplification.
        // A real implementation would likely store fees on the booking document itself.
        const feesToday = grossToday * 0.12; // Placeholder calculation

        setRevenueToday({
            gross: grossToday,
            fees: feesToday,
            refunds: 0 // Placeholder
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [firestore]);


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
                       {card.key === 'revenue' ? `₦${(kpiValues.revenue || 0).toLocaleString()}` : (kpiValues[card.key as keyof typeof kpiValues] || 0).toLocaleString()}
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
                    <CardDescription>Live financial data for today.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                        <>
                           <div className="flex justify-between items-baseline">
                                <span className="text-muted-foreground">Gross Booking Value</span>
                                <span className="font-bold text-lg">₦{revenueToday.gross.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-muted-foreground">Platform Fees Earned</span>
                                <span className="font-bold text-lg text-green-600">₦{revenueToday.fees.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-muted-foreground">Refunds Issued</span>
                                <span className="font-bold text-lg text-red-600">₦{revenueToday.refunds.toLocaleString()}</span>
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
            {/* {safetyAlerts.map(alert => (
              <Link key={alert.text} href={alert.href} className="flex items-start gap-3 p-2 -m-2 rounded-lg hover:bg-destructive/10">
                <alert.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">{alert.text}</span>
              </Link>
            ))} */}
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
                {/* <ul className="space-y-4">
                     {activityFeed.map((item, index) => (
                        <li key={index} className="flex items-center gap-3">
                           <item.icon className="h-5 w-5 text-muted-foreground" />
                           <span className="flex-1 text-sm">{item.text}</span>
                           <span className="text-xs text-muted-foreground">{item.time}</span>
                        </li>
                     ))}
                </ul> */}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}

    