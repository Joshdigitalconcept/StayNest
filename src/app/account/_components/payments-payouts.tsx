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

export function PaymentsPayoutsSection() {
  const { user } = useUser();
  const firestore = useFirestore();

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
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">No payment methods saved.</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Add Card</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>
                  Enter your card details. This is a placeholder and does not process real payments.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="card-number" className="text-right">Card Number</Label>
                  <Input id="card-number" placeholder="**** **** **** ****" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="expiry" className="text-right">Expiry</Label>
                  <Input id="expiry" placeholder="MM/YY" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cvc" className="text-right">CVC</Label>
                  <Input id="cvc" placeholder="123" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Card</Button>
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
          <CardContent>
             <p className="text-sm text-muted-foreground mb-4">No payout methods saved.</p>
             <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Add Bank Account</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Payout Method</DialogTitle>
                    <DialogDescription>
                      Enter your bank details to receive payouts. This is a placeholder.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="account-holder" className="text-right">Account Holder</Label>
                      <Input id="account-holder" placeholder="John Doe" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="routing-number" className="text-right">Routing Number</Label>
                      <Input id="routing-number" placeholder="123456789" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="account-number" className="text-right">Account Number</Label>
                      <Input id="account-number" placeholder="000123456789" className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Account</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
