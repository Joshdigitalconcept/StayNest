
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
import { Shield, Settings, Key, UserPlus, Loader2, Trash2, Search } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useDoc, errorEmitter, FirestorePermissionError, useUser } from '@/firebase';
import { collection, query, doc, updateDoc, setDoc, deleteDoc, serverTimestamp, where, getDocs, limit } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminSettingsPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [searchEmail, setSearchEmail] = React.useState('');
  const [isAddingAdmin, setIsAddingAdmin] = React.useState(false);

  // 1. Admin Roles Management
  const adminsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'roles_admin')) : null, [firestore]);
  const { data: admins, isLoading: isAdminsLoading } = useCollection(adminsQuery);

  // 2. Platform Config (Real-time)
  const platformConfigRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'platform') : null, [firestore]);
  const { data: config, isLoading: isConfigLoading } = useDoc(platformConfigRef);

  const handleToggleConfig = async (key: string, value: boolean) => {
    if (!platformConfigRef) return;
    try {
      await setDoc(platformConfigRef, { [key]: value }, { merge: true });
      toast({ title: "Setting Updated", description: `${key} is now ${value ? 'enabled' : 'disabled'}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Update Failed", description: error.message });
    }
  };

  const handleRevokeAdmin = async (userId: string) => {
    if (userId === currentUser?.uid) {
      toast({ variant: 'destructive', title: "Action Denied", description: "You cannot revoke your own admin status." });
      return;
    }
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'roles_admin', userId));
      toast({ title: "Admin Revoked", description: "The user no longer has administrative access." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Revocation Failed", description: error.message });
    }
  };

  const handleAddAdminByEmail = async () => {
    if (!searchEmail.trim() || !firestore) return;
    setIsAddingAdmin(true);
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', searchEmail.trim()), limit(1));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: 'destructive', title: "User Not Found", description: "No user found with that email address." });
      } else {
        const targetUser = snap.docs[0];
        await setDoc(doc(firestore, 'roles_admin', targetUser.id), {
          grantedAt: serverTimestamp(),
          by: currentUser?.email,
          email: targetUser.data().email
        });
        toast({ title: "Admin Added", description: `${targetUser.data().email} is now an administrator.` });
        setSearchEmail('');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Operation Failed", description: error.message });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Manage platform configuration and administrative access in real-time.</p>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles" className="gap-2"><Shield className="h-4 w-4" /> Admin Roles</TabsTrigger>
          <TabsTrigger value="platform" className="gap-2"><Settings className="h-4 w-4" /> Platform Config</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Key className="h-4 w-4" /> API & Security</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle>Authorized Administrators</CardTitle>
                <CardDescription>Users with full access to the admin panel.</CardDescription>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Input 
                  placeholder="Admin Email..." 
                  value={searchEmail} 
                  onChange={(e) => setSearchEmail(e.target.value)} 
                  className="max-w-[250px]"
                />
                <Button onClick={handleAddAdminByEmail} disabled={isAddingAdmin}>
                  {isAddingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Add Admin
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isAdminsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin Email</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Granted At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins?.map(admin => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.email || 'Legacy Admin'}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{admin.id}</TableCell>
                        <TableCell className="text-xs">
                          {admin.grantedAt ? format(admin.grantedAt.toDate(), 'PPP') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleRevokeAdmin(admin.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke
                          </Button>
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
              <CardDescription>Global settings for StayNest operations. Changes are saved instantly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isConfigLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6" /></div>
              ) : (
                <>
                  <div className="flex items-center justify-between space-x-2 border-b pb-4">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="maintenanceMode" className="text-base font-bold">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Disable all bookings and listings temporarily for all users.</p>
                    </div>
                    <Switch 
                      id="maintenanceMode" 
                      checked={!!config?.maintenanceMode} 
                      onCheckedChange={(v) => handleToggleConfig('maintenanceMode', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2 border-b pb-4">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="autoApproveHosts" className="text-base font-bold">Auto-approve Hosts</Label>
                      <p className="text-sm text-muted-foreground">Automatically grant host privileges to new applicants without manual review.</p>
                    </div>
                    <Switch 
                      id="autoApproveHosts" 
                      checked={!!config?.autoApproveHosts} 
                      onCheckedChange={(v) => handleToggleConfig('autoApproveHosts', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2 pb-4">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="globalInstantBook" className="text-base font-bold">Enforce Instant Book</Label>
                      <p className="text-sm text-muted-foreground">Force all new property listings to use "Instant Book" by default.</p>
                    </div>
                    <Switch 
                      id="globalInstantBook" 
                      checked={!!config?.globalInstantBook} 
                      onCheckedChange={(v) => handleToggleConfig('globalInstantBook', v)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>API & Security Protocols</CardTitle>
              <CardDescription>Configure external integrations and security headers.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="p-8 border-2 border-dashed rounded-lg text-center">
                  <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground font-medium">Advanced security configurations are managed via Firebase Console.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <a href="https://console.firebase.google.com" target="_blank">Open Console</a>
                  </Button>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
