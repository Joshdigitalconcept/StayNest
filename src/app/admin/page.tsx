
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Home, BookCheck, AlertTriangle, ShieldCheck, FileText, BarChart2 } from 'lucide-react';

const kpiCards = [
    { title: 'Total Users', value: '1,250', icon: Users, change: '+150 this month' },
    { title: 'Active Listings', value: '840', icon: Home, change: '+40 this week' },
    { title: 'Bookings Today', value: '75', icon: BookCheck, change: '-5 from yesterday' },
    { title: 'Pending Disputes', value: '8', icon: AlertTriangle, change: '+2 new', variant: 'destructive' },
    { title: 'Suspended Accounts', value: '12', icon: Users, variant: 'destructive' },
    { title: 'Flagged Listings', value: '23', icon: Home, variant: 'destructive' },
];

const sectionCards = [
    { title: "Trust & Safety", description: "Verify IDs, detect fraud, manage flags.", icon: ShieldCheck, href: "/admin/trust-safety" },
    { title: "Content & Policies", description: "Manage TOS, policies, and help articles.", icon: FileText, href: "/admin/content" },
    { title: "Analytics", description: "Explore platform metrics and insights.", icon: BarChart2, href: "/admin/analytics" },
];


export default function AdminDashboard() {
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
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground">{card.change}</p>
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
