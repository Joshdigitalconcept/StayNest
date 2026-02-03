'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Settings, Key, UserPlus, Loader2, Trash2, Search, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, doc, setDoc, deleteDoc, serverTimestamp, where, getDocs, limit } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ADMIN_ROLES_LIST, type AdminRole, type AdminRecord } from '@/lib/types';
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
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [selectedRoles, setSelectedRoles] = React.useState<AdminRole[]>(['support']);
  const [isSuperAdminSelected, setIsSuperAdminSelected] = React.useState(false);

  // 1. Admin Roles Management
  const adminsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'roles_admin')) : null, [firestore]);
  const { data: admins, isLoading: isAdminsLoading } = useCollection<AdminRecord>(adminsQuery);

  // 2. Platform Config (Real-time)
  const platformConfigRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'platform') : null, [firestore]);
  const { data: config, isLoading: isConfigLoading } = useDoc(platformConfigRef);

  const currentUserAdminRecord = React.useMemo(() => {
    return admins?.find(a => a.id === currentUser?.uid);
  }, [admins, currentUser]);

  const handleToggleConfig = async (key: string, value: boolean) => {
    if (!platformConfigRef) return;
    try {
      await setDoc(platformConfigRef, { [key]: value }, { merge: true });
      toast({ title: "Setting Updated", description: `${key} is now ${value ? 'enabled' : 'disabled'}.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Update Failed", description: error.message });
    }
  };

  const handleRevokeAdmin = async (admin: AdminRecord) => {
    if (admin.id === currentUser?.uid) {
      toast({ variant: 'destructive', title: "Action Denied", description: "You cannot revoke your own admin status." });
      return;
    }
    
    if (admin.isSuperAdmin && !currentUserAdminRecord?.isSuperAdmin) {
      toast({ variant: 'destructive', title: "Permission Denied", description: "Only Super Admins can remove other Super Admins." });
      return;
    }

    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'roles_admin', admin.id));
      toast({ title: "Admin Revoked", description: "The user no longer has administrative access." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Revocation Failed", description: error.message });
    }
  };

  const handleRoleToggle = (roleId: AdminRole) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
    );
  };

  const handleAddAdminByEmail = async () => {
    const email = searchEmail.trim();
    if (!email || !firestore) return;
    
    setIsAddingAdmin(true);
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', email), limit(1));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ 
          variant: 'destructive', 
          title: "User Not Found", 
          description: `No profile exists for ${email}. Users must log in once to create a profile.` 
        });
      } else {
        const targetUser = snap.docs[0];
        const userData = targetUser.data();
        
        await setDoc(doc(firestore, 'roles_admin', targetUser.id), {
          grantedAt: serverTimestamp(),
          by: currentUser?.email || 'System',
          email: userData.email || email,
          name: `${userData.firstName} ${userData.lastName}`.trim(),
          roles: isSuperAdminSelected ? ['super_admin'] : selectedRoles,
          isSuperAdmin: isSuperAdminSelected
        });
        
        toast({ title: "Admin Added", description: `${email} is now an administrator.` });
        setSearchEmail('');
        setSelectedRoles(['support']);
        setIsSuperAdminSelected(false);
        setIsAddDialogOpen(false);
      }
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: "Operation Failed", 
        description: error.message || "Failed to grant admin privileges." 
      });
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
                <CardDescription>Users with administrative access. Super Admins can manage other admins.</CardDescription>
              </div>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    New Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Administrator</DialogTitle>
                    <DialogDescription>
                      Assign roles and privileges to a platform user. They must have already registered.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">User Email (case-sensitive)</Label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="email"
                          placeholder="admin@example.com" 
                          value={searchEmail} 
                          onChange={(e) => setSearchEmail(e.target.value)} 
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 border-primary/20">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-primary" />
                            Assign as Super Admin
                          </Label>
                          <p className="text-xs text-muted-foreground">Full access to everything, including managing other admins.</p>
                        </div>
                        <Switch checked={isSuperAdminSelected} onCheckedChange={setIsSuperAdminSelected} />
                      </div>

                      {!isSuperAdminSelected && (
                        <div className="space-y-3">
                          <Label className="text-sm font-bold">Specific Privileges</Label>
                          <div className="grid grid-cols-1 gap-2">
                            {ADMIN_ROLES_LIST.map(role => (
                              <div key={role.id} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50 transition-colors">
                                <Checkbox 
                                  id={role.id} 
                                  checked={selectedRoles.includes(role.id as AdminRole)} 
                                  onCheckedChange={() => handleRoleToggle(role.id as AdminRole)}
                                />
                                <div className="grid gap-1 leading-none">
                                  <label htmlFor={role.id} className="text-sm font-medium cursor-pointer">{role.label}</label>
                                  <p className="text-[10px] text-muted-foreground">{role.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddAdminByEmail} disabled={isAddingAdmin || !searchEmail}>
                      {isAddingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                      Confirm Access
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isAdminsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
              ) : !admins || admins.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">No administrators found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Administrator</TableHead>
                      <TableHead>Roles & Status</TableHead>
                      <TableHead>Granted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map(admin => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold flex items-center gap-2">
                              {admin.name || 'Admin User'}
                              {admin.isSuperAdmin && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                  SUPER
                                </Badge>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">{admin.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {admin.isSuperAdmin ? (
                              <Badge className="text-[9px] uppercase font-bold">ALL ACCESS</Badge>
                            ) : (
                              admin.roles?.map(r => (
                                <Badge key={r} variant="secondary" className="text-[9px] uppercase font-bold">
                                  {r}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">
                          {admin.grantedAt ? format(admin.grantedAt.toDate(), 'PPP') : 'N/A'}
                          {admin.by && <p className="italic">by {admin.by}</p>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleRevokeAdmin(admin)}
                            disabled={admin.id === currentUser?.uid || (admin.isSuperAdmin && !currentUserAdminRecord?.isSuperAdmin)}
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
              <CardDescription>Global operational settings. Changes are saved instantly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isConfigLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
              ) : (
                <>
                  <div className="flex items-center justify-between space-x-2 border-b pb-4">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="maintenanceMode" className="text-base font-bold">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Temporarily disable public site access.</p>
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
                      <p className="text-sm text-muted-foreground">Automatically grant host status to new sign-ups.</p>
                    </div>
                    <Switch 
                      id="autoApproveHosts" 
                      checked={!!config?.autoApproveHosts} 
                      onCheckedChange={(v) => handleToggleConfig('autoApproveHosts', v)}
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
              <CardDescription>Manage keys and advanced infrastructure settings.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="p-8 border-2 border-dashed rounded-lg text-center">
                  <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground font-medium">Infrastructure settings are managed via the Firebase Cloud Console.</p>
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
