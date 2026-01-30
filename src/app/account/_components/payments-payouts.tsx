
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
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { User } from '@/lib/types';
import { doc, collection, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { CreditCard, Landmark, Plus, Check, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function PaymentsPayoutsSection() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc<User>(userProfileRef);

  const paymentMethodsRef = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'payment_methods') : null),
    [user, firestore]
  );
  const { data: paymentMethods, isLoading: isMethodsLoading } = useCollection(paymentMethodsRef);

  const handleAddCard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !paymentMethodsRef) return;

    setIsAdding(true);
    const formData = new FormData(e.currentTarget);
    const lastFour = formData.get('cardNumber')?.toString().slice(-4) || '4242';

    const cardData = {
      lastFour,
      expiry: formData.get('expiry'),
      type: 'visa',
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(paymentMethodsRef, cardData);
      toast({ title: 'Success', description: 'Payment method saved.' });
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: paymentMethodsRef.path,
        operation: 'create',
        requestResourceData: cardData,
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'payment_methods', id));
      toast({ title: 'Deleted', description: 'Payment method removed.' });
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your saved payment methods for bookings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMethodsLoading ? (
            <Loader2 className="animate-spin h-6 w-6" />
          ) : paymentMethods && paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg bg-accent/5">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-2 rounded">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">•••• {method.lastFour}</p>
                      <p className="text-sm text-muted-foreground">Expires {method.expiry}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteMethod(method.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
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
              <form onSubmit={handleAddCard}>
                <DialogHeader>
                  <DialogTitle>Add Card</DialogTitle>
                  <DialogDescription>
                    Enter your card details to save for future reservations.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input id="card-number" name="cardNumber" placeholder="4242 4242 4242 4242" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="expiry">Expiry</Label>
                      <Input id="expiry" name="expiry" placeholder="MM/YY" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input id="cvc" name="cvc" placeholder="123" required />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isAdding}>
                    {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Card
                  </Button>
                </DialogFooter>
              </form>
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
