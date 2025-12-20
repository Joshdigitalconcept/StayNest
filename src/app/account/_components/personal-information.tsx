'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { User as UserType } from '@/lib/types';

function InfoRow({ label, value, verified = false }: { label: string; value?: string | null, verified?: boolean }) {
    return (
        <div className="flex justify-between items-center py-3">
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{value || 'Not provided'}</p>
            </div>
            {verified && <span className="text-sm text-green-600 font-semibold">Verified</span>}
        </div>
    );
}


export function PersonalInformationSection() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(
      () => (user ? doc(firestore, 'users', user.uid) : null),
      [user, firestore]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserType>(userProfileRef);

    if (isUserLoading || isProfileLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    if (!user || !userProfile) {
        return <p>User not found.</p>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                    Manage your identity, trust, and communication details.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between py-3">
                     <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={userProfile.profilePictureUrl} alt="Profile photo" />
                            <AvatarFallback>{userProfile.firstName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{userProfile.firstName} {userProfile.lastName}</p>
                            <p className="text-sm text-muted-foreground">Profile Photo</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/profile/edit">Edit</Link>
                    </Button>
                </div>
               
                <Separator />
                <InfoRow label="First Name" value={userProfile.firstName} />
                <Separator />
                <InfoRow label="Last Name" value={userProfile.lastName} />
                <Separator />
                <InfoRow label="Email Address" value={userProfile.email} verified={user.emailVerified} />
                <Separator />
                <InfoRow label="Phone Number" value={user.phoneNumber} verified={!!user.phoneNumber} />
                 <Separator />
                <InfoRow label="Date of Birth" value={userProfile.born} />
            </CardContent>
        </Card>
    );
}
