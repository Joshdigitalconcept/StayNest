
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Settings, Key, UserPlus, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default function AdminSettingsPage() {
  const firestore = useFirestore();
  const adminsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'roles_admin')) : null, [firestore]);
  const { data: admins, isLoading } = useCollection(adminsQuery);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Manage platform configuration and administrative access.</p>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles" className="gap-2"><Shield className="h-4 w-4" /> Admin Roles</TabsTrigger>
          <TabsTrigger value="platform" className="gap-2"><Settings className="h-4 w-4" /> Platform Config</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Key className="h-4 w-4" /> API & Security</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Authorized Administrators</CardTitle>
                <CardDescription>Users with full access to the admin panel.</CardDescription>
              </div>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" /> Add Admin
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Granted At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins?.map(admin => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-mono text-xs">{admin.id}</TableCell>
                        <TableCell className="text-sm font-medium">{admin.by || 'Legacy'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {admin.grantedAt ? format(admin.grantedAt.toDate(), 'PPP') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="text-destructive">Revoke</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform">
          <Card>
            <CardHeader>
              <CardTitle>Platform Configuration</CardTitle>
              <CardDescription>Global settings for StayNest operations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="maintenance">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Disable all bookings and listings temporarily.</p>
                </div>
                <Switch id="maintenance" />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="auto-approval">Auto-approve Hosts</Label>
                  <p className="text-sm text-muted-foreground">Skip manual review for new host applications.</p>
                </div>
                <Switch id="auto-approval" />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="instant-payouts">Global Instant Book</Label>
                  <p className="text-sm text-muted-foreground">Force instant book capability for all new listings.</p>
                </div>
                <Switch id="instant-payouts" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
