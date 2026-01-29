
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Home, BookCheck, AlertTriangle, ShieldCheck, FileText, BarChart2, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

export default function AdminDashboard() {
  const firestore = useFirestore();

  // Statistics queries - note: these will only succeed if firestore.rules allow unfiltered list for admins
  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const listingsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'listings')) : null, [firestore]);
  const bookingsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'bookings')) : null, [firestore]);

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: listings, isLoading: listingsLoading } = useCollection(listingsQuery);
  const { data: bookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);

  const stats = [
    { title: 'Total Users', value: users?.length || 0, icon: Users, loading: usersLoading },
    { title: 'Active Listings', value: listings?.length || 0, icon: Home, loading: listingsLoading },
    { title: 'Total Bookings', value: bookings?.length || 0, icon: BookCheck, loading: bookingsLoading },
    { title: 'Pending Support', value: '0', icon: AlertTriangle, variant: 'destructive', loading: false },
  ];

  const sectionCards = [
    { title: "Trust & Safety", description: "Verify IDs, detect fraud, manage flags.", icon: ShieldCheck, href: "/admin/trust-safety" },
    { title: "Content & Policies", description: "Manage TOS, policies, and help articles.", icon: FileText, href: "/admin/content" },
    { title: "Analytics", description: "Explore platform metrics and insights.", icon: BarChart2, href: "/admin/analytics" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.variant === 'destructive' ? 'text-destructive' : ''}`} />
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sectionCards.map(card => (
          <Card key={card.title} className="hover:bg-muted/50 cursor-pointer transition-colors">
            <CardHeader>
              <div className="flex items-center gap-4">
                <card.icon className="h-6 w-6 text-primary" />
                <CardTitle>{card.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
