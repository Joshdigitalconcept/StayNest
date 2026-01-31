
'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, ShieldAlert, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function AdminTrustSafetyPage() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc')) : null,
    [firestore]
  );
  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const alerts = [
    { type: 'ID Verification', count: 12, icon: UserCheck, color: 'text-blue-600' },
    { type: 'Fraud Flags', count: 3, icon: AlertTriangle, color: 'text-amber-600' },
    { type: 'Pending Reviews', count: 8, icon: ShieldAlert, color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trust & Safety</h1>
        <p className="text-muted-foreground">Manage user verification, security flags, and identity protocols.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {alerts.map(alert => (
          <Card key={alert.type}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{alert.type}</CardTitle>
              <alert.icon className={`h-4 w-4 ${alert.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alert.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Verification Status</CardTitle>
          <CardDescription>Review and validate user identity documents.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8" /></div>
          ) : !users ? (
            <p className="text-center py-12 text-muted-foreground">No data found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>ID Verified</TableHead>
                  <TableHead>Email Verified</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profilePictureUrl} />
                          <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{user.firstName} {user.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.idVerified ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.emailVerified ? (
                        <span className="text-green-600 text-xs font-bold">Success</span>
                      ) : (
                        <span className="text-amber-600 text-xs font-bold">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-[15%]" />
                        </div>
                        <span className="text-[10px] font-bold">Low</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">Verify Manually</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
