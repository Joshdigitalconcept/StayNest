'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { PersonalInformationSection } from './_components/personal-information';
import { LoginSecuritySection } from './_components/login-security';
import { PaymentsPayoutsSection } from './_components/payments-payouts';
import { PrivacySharingSection } from './_components/privacy-sharing';

const sections = {
  'personal-info': { title: 'Personal Information', component: PersonalInformationSection },
  'login-security': { title: 'Login & Security', component: LoginSecuritySection },
  'payments-payouts': { title: 'Payments & Payouts', component: PaymentsPayoutsSection },
  'privacy-sharing': { title: 'Privacy & Sharing', component: PrivacySharingSection },
  // Add other sections here as they are built
};

type SectionId = keyof typeof sections;

function AccountSidebar({ activeSection, onSelect }: { activeSection: SectionId, onSelect: (id: SectionId) => void }) {
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

  const initialSection = (searchParams.get('section') as SectionId) || 'personal-info';
  const [activeSection, setActiveSection] = React.useState<SectionId>(
    Object.keys(sections).includes(initialSection) ? initialSection : 'personal-info'
  );

  React.useEffect(() => {
    const section = (searchParams.get('section') as SectionId) || 'personal-info';
    if(Object.keys(sections).includes(section)) {
        setActiveSection(section);
    }
  }, [searchParams]);

  const handleSectionSelect = (id: SectionId) => {
    setActiveSection(id);
    router.push(`/account?section=${id}`, { scroll: false });
  };
  
  if (isUserLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>;
  }

  if (!user) {
    router.push('/login');
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>;
  }
  
  const ActiveComponent = sections[activeSection].component;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold font-headline mb-8">Account Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <aside className="md:col-span-1">
          <AccountSidebar activeSection={activeSection} onSelect={handleSectionSelect} />
        </aside>
        <main className="md:col-span-3">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
