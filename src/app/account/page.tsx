
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Loader2, Share2 } from 'lucide-react';
import { PersonalInformationSection } from './_components/personal-information';
import { LoginSecuritySection } from './_components/login-security';
import { PaymentsPayoutsSection } from './_components/payments-payouts';
import { PrivacySharingSection } from './_components/privacy-sharing';
import { AdminSection } from './_components/admin-section';
import { doc } from 'firebase/firestore';

const baseSections = {
  'personal-info': { title: 'Personal Information', component: PersonalInformationSection },
  'login-security': { title: 'Login & Security', component: LoginSecuritySection },
  'payments-payouts': { title: 'Payments & Payouts', component: PaymentsPayoutsSection },
  'privacy-sharing': { title: 'Privacy & Sharing', component: PrivacySharingSection },
};

const adminSection = {
  'admin': { title: 'Admin Dashboard', component: AdminSection },
};

type SectionId = keyof typeof baseSections | keyof typeof adminSection;

function AccountSidebar({ activeSection, onSelect, isAdmin }: { activeSection: SectionId, onSelect: (id: SectionId) => void, isAdmin: boolean }) {
  const sections = isAdmin ? { ...baseSections, ...adminSection } : baseSections;
  
  return (
    <nav className="flex flex-col gap-1">
      {Object.entries(sections).map(([id, { title }]) => (
        <Button
          key={id}
          variant="ghost"
          className={cn(
            'justify-start',
            activeSection === id && 'bg-accent text-accent-foreground'
          )}
          onClick={() => onSelect(id as SectionId)}
        >
          {title}
        </Button>
      ))}
    </nav>
  );
}

export default function AccountPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();

  // Check for admin role
  const adminRoleRef = useMemoFirebase(
    () => (user ? doc(firestore, 'roles_admin', user.uid) : null),
    [user, firestore]
  );
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole;

  const sections = isAdmin ? { ...baseSections, ...adminSection } : baseSections;
  const validSectionIds = Object.keys(sections);

  const initialSection = (searchParams.get('section') as SectionId) || 'personal-info';
  const [activeSection, setActiveSection] = React.useState<SectionId>(
    validSectionIds.includes(initialSection) ? initialSection : 'personal-info'
  );
  
  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  React.useEffect(() => {
    const sectionFromParams = (searchParams.get('section') as SectionId) || 'personal-info';
    if (validSectionIds.includes(sectionFromParams)) {
        setActiveSection(sectionFromParams);
    } else {
        setActiveSection('personal-info');
    }
  }, [searchParams, validSectionIds]);

  const handleSectionSelect = (id: SectionId) => {
    setActiveSection(id);
    router.push(`/account?section=${id}`, { scroll: false });
  };

  const isLoading = isUserLoading || isAdminRoleLoading;

  if (isLoading || !user) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>;
  }
  
  const ActiveComponent = sections[activeSection].component;

  return (
    <div className="container mx-auto py-8">
       <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline">Account Settings</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <aside className="md:col-span-1">
          <AccountSidebar activeSection={activeSection} onSelect={handleSectionSelect} isAdmin={isAdmin} />
        </aside>
        <main className="md:col-span-3">
          {/* Pass isAdmin prop to the active component, specifically for AdminSection */}
          {activeSection === 'admin' ? <AdminSection isAdmin={isAdmin} /> : <ActiveComponent />}
        </main>
      </div>
    </div>
  );
}
