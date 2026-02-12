
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Loader2, TrendingUp, Users, BookOpen, Wallet } from 'lucide-react';
import { subMonths, format, isSameMonth, startOfMonth } from 'date-fns';
import type { Booking, User, Property } from '@/lib/types';

const chartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--primary))",
  },
  users: {
    label: "New Users",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

export default function AdminAnalyticsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const bookingsQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, 'bookings')) : null, 
    [firestore, user]
  );
  const usersQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, 'users')) : null, 
    [firestore, user]
  );
  const listingsQuery = useMemoFirebase(
    () => (firestore && user) ? query(collection(firestore, 'listings')) : null, 
    [firestore, user]
  );
  
  const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsQuery);
  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);
  const { data: listings, isLoading: listingsLoading } = useCollection<Property>(listingsQuery);

  const isLoading = bookingsLoading || usersLoading || listingsLoading;

  const { chartData, stats } = React.useMemo(() => {
    if (!bookings || !users || !listings) {
      return { chartData: [], stats: { totalVolume: 0, activeListings: 0, newUsersThisMonth: 0 } };
    }

    // 1. Generate last 6 months of labels
    const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));

    // 2. Map data to months
    const trendData = last6Months.map(monthDate => {
      const monthLabel = format(monthDate, 'MMM');
      
      const monthlyBookings = bookings.filter(b => {
        const date = b.createdAt?.toDate();
        return date && isSameMonth(date, monthDate);
      }).length;

      const monthlyUsers = users.filter(u => {
        const date = u.createdAt?.toDate();
        return date && isSameMonth(date, monthDate);
      }).length;

      return {
        month: monthLabel,
        bookings: monthlyBookings,
        users: monthlyUsers,
      };
    });

    // 3. Calculate Summary Stats
    const totalVolume = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((acc, b) => acc + (b.totalPrice || 0), 0);

    const newUsersThisMonth = users.filter(u => {
      const date = u.createdAt?.toDate();
      return date && isSameMonth(date, new Date());
    }).length;

    return {
      chartData: trendData,
      stats: {
        totalVolume,
        activeListings: listings.length,
        newUsersThisMonth
      }
    };
  }, [bookings, users, listings]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Analytics</h1>
        <p className="text-muted-foreground">Real-time performance metrics derived from platform activity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Trends</CardTitle>
            <CardDescription>Total reservations per month (Last 6 Months)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="var(--color-bookings)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "var(--color-bookings)" }} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Acquisition</CardTitle>
            <CardDescription>New account registrations (Last 6 Months)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="users" fill="var(--color-users)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Total Platform Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">₦{stats.totalVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sum of all confirmed reservations
            </p>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Active Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.activeListings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Properties currently live on StayNest
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Monthly Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              New users joined in {format(new Date(), 'MMMM')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
