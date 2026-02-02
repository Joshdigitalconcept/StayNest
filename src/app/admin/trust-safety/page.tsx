'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
import { 
  Loader2, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  AlertTriangle, 
  Search, 
  MoreHorizontal, 
  UserMinus, 
  UserPlus, 
  Ban, 
  CheckCircle2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminTrustSafetyPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);

  const usersQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc')) : null,
    [firestore]
  );
  const { data: users, isLoading } = useCollection<User>(usersQuery);

  const filteredUsers = React.useMemo(() => {
    if (!users) return null;
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(u => 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) || 
      u.email.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const stats = React.useMemo(() => {
    if (!users) return [
        { type: 'Verification Requests', count: 0, icon: UserCheck, color: 'text-blue-600' },
        { type: 'Active Profiles', count: 0, icon: ShieldCheck, color: 'text-green-600' },
        { type: 'Account Flags', count: 0, icon: ShieldAlert, color: 'text-red-600' },
    ];
    
    return [
        { type: 'Verification Requests', count: users.filter(u => !u.idVerified).length, icon: UserCheck, color: 'text-blue-600' },
        { type: 'Active Profiles', count: users.filter(u => u.accountStatus === 'active' || !u.accountStatus).length, icon: ShieldCheck, color: 'text-green-600' },
        { type: 'Account Flags', count: users.filter(u => u.accountStatus === 'suspended' || u.accountStatus === 'banned').length, icon: AlertTriangle, color: 'text-amber-600' },
    ];
  }, [users]);

  const handleUpdateStatus = async (userId: string, data: Partial<User>) => {
    if (!firestore) return;
    setIsProcessing(userId);
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Update Successful", description: "User record has been modified." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Update Failed", description: error.message });
    } finally {
      setIsProcessing(null);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    const s = status || 'active';
    switch (s) {
      case 'active': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'suspended': return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Suspended</Badge>;
      case 'banned': return <Badge variant="destructive">Banned</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-headline">Trust & Safety</h1>
        <p className="text-muted-foreground">Manage user verification, account standing, and identity protocols.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(alert => (
          <Card key={alert.type} className="border-none shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{alert.type}</CardTitle>
              <alert.icon className={`h-4 w-4 ${alert.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{alert.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Security & Verification Roster</CardTitle>
              <CardDescription>Live data reflecting current user compliance and verification status.</CardDescription>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by name or email..."
                className="pl-8 w-full md:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : !filteredUsers || filteredUsers.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No user records found matching your search.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>ID Status</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead className="text-right">Safety Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.profilePictureUrl} />
                          <AvatarFallback className="bg-primary/5 text-primary">{user.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.idVerified ? (
                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                          <ShieldCheck className="h-4 w-4" /> Verified
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <UserMinus className="h-4 w-4" /> Unverified
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.accountStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              user.accountStatus === 'banned' ? 'bg-red-600 w-full' : 
                              user.accountStatus === 'suspended' ? 'bg-amber-500 w-[70%]' : 
                              user.idVerified ? 'bg-green-500 w-[10%]' : 'bg-blue-400 w-[30%]'
                            )} 
                          />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">
                          {user.accountStatus === 'banned' ? 'Critical' : 
                           user.accountStatus === 'suspended' ? 'High' : 
                           user.idVerified ? 'Minimal' : 'Moderate'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isProcessing === user.id}>
                            {isProcessing === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Moderation Tools</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {!user.idVerified && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, { idVerified: true })} className="text-green-600 font-medium">
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Verify Identity
                            </DropdownMenuItem>
                          )}
                          {user.idVerified && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, { idVerified: false })}>
                              <UserMinus className="mr-2 h-4 w-4" /> Revoke ID Status
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {user.accountStatus !== 'active' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, { accountStatus: 'active' })}>
                              <UserPlus className="mr-2 h-4 w-4" /> Restore Account
                            </DropdownMenuItem>
                          )}
                          {user.accountStatus !== 'suspended' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, { accountStatus: 'suspended' })} className="text-amber-600">
                              <AlertTriangle className="mr-2 h-4 w-4" /> Suspend User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleUpdateStatus(user.id, { accountStatus: 'banned' })} className="text-destructive font-bold">
                            <Ban className="mr-2 h-4 w-4" /> Permanent Ban
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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