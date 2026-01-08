'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Home, BookCheck, AlertTriangle, ShieldCheck, FileText, BarChart2, Loader2, BookCopy } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { User, Property, Booking } from '@/lib/types';


export default function AdminDashboard() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const listingsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'listings') : null, [firestore]);
  const bookingsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'bookings') : null, [firestore]);
  const pendingBookingsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'bookings'), where('status', '==', 'pending')) : null, [firestore]);

  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);
  const { data: listings, isLoading: listingsLoading } = useCollection<Property>(listingsQuery);
  const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsQuery);
  const { data: pendingBookings, isLoading: pendingBookingsLoading } = useCollection<Booking>(pendingBookingsQuery);

  const isLoading = usersLoading || listingsLoading || bookingsLoading || pendingBookingsLoading;

  const kpiCards = [
    { title: 'Total Users', value: users?.length ?? 0, icon: Users },
    { title: 'Active Listings', value: listings?.length ?? 0, icon: Home },
    { title: 'Total Bookings', value: bookings?.length ?? 0, icon: BookCopy },
    { title: 'Pending Bookings', value: pendingBookings?.length ?? 0, icon: AlertTriangle, variant: 'destructive' },
  ];

  const sectionCards = [
      { title: "Trust & Safety", description: "Verify IDs, detect fraud, manage flags.", icon: ShieldCheck, href: "/admin/trust-safety" },
      { title: "Content & Policies", description: "Manage TOS, policies, and help articles.", icon: FileText, href: "/admin/content" },
      { title: "Analytics", description: "Explore platform metrics and insights.", icon: BarChart2, href: "/admin/analytics" },
  ];

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map(card => (
                 <Card key={card.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className={`h-4 w-4 text-muted-foreground ${card.variant === 'destructive' ? 'text-destructive' : ''}`} />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                           <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                           <div className="text-2xl font-bold">{card.value}</div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {sectionCards.map(card => (
                 <Card key={card.title} className="hover:bg-muted/50 cursor-pointer">
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
