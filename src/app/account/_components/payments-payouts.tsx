'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { User } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { CreditCard, Landmark, Plus, Check } from 'lucide-react';
import { useState } from 'react';

export function PaymentsPayoutsSection() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [hasAddedCard, setHasAddedCard] = useState(false);

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc<User>(userProfileRef);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your saved payment methods for bookings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasAddedCard ? (
             <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/10">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-2 rounded">
                        <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold">•••• 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/26</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <Check className="h-4 w-4" /> Default
                </div>
             </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">No payment methods saved.</p>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Payment Method
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Card</DialogTitle>
                <DialogDescription>
                  Enter your card details. This is a placeholder and does not process real payments.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input id="card-number" placeholder="**** **** **** 4242" defaultValue="4242 4242 4242 4242" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="expiry">Expiry</Label>
                        <Input id="expiry" placeholder="MM/YY" defaultValue="12/26" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" placeholder="123" defaultValue="123" />
                    </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={() => setHasAddedCard(true)}>Save Card</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {userProfile?.isHost && (
        <Card>
          <CardHeader>
            <CardTitle>Payout Methods</CardTitle>
            <CardDescription>Manage how you receive payments for your listings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center gap-4 p-4 border rounded-lg border-dashed">
                <Landmark className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                    <p className="font-medium text-muted-foreground">No bank account linked</p>
                    <p className="text-xs text-muted-foreground">Add an account to receive your earnings from Nigeria-based stays.</p>
                </div>
             </div>

             <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Add Bank Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Payout Method</DialogTitle>
                    <DialogDescription>
                      Link a Nigerian bank account to receive payouts in Naira (₦).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bank">Select Bank</Label>
                      <Input id="bank" placeholder="e.g. Zenith Bank, GTBank" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="account-number">Account Number</Label>
                      <Input id="account-number" placeholder="10-digit NUBAN" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="account-holder">Account Name</Label>
                      <Input id="account-holder" placeholder="Account Name" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Link Account</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
