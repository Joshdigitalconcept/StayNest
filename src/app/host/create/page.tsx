
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useHostOnboarding } from '@/hooks/use-host-onboarding';
import Step1_Structure from './_components/step1-structure';
import Step2_Privacy from './_components/step2-privacy';
import Step3_Location from './_components/step3-location';
import Step4_FloorPlan from './_components/step4-floorplan';
import Step5_Amenities from './_components2/step5-amenities';
import Step6_Photos from './_components2/step6-photos';
import Step7_Title from './_components2/step7-title';
import Step8_Description from './_components2/step8-description';
import Step9_Booking from './_components3/step9-booking';
import Step10_Price from './_components3/step10-price';
import Step11_Discounts from './_components3/step11-discounts';
import Step12_Legal from './_components3/step12-legal';
import Step13_Review from './_components3/step13-review';
import { doc } from 'firebase/firestore';
import type { User as UserType } from '@/lib/types';


const steps = [
  { component: Step1_Structure, group: 1, title: 'Property Type' },
  { component: Step2_Privacy, group: 1, title: 'Guest Space' },
  { component: Step3_Location, group: 1, title: 'Location' },
  { component: Step4_FloorPlan, group: 1, title: 'Floor Plan' },
  { component: Step5_Amenities, group: 2, title: 'Amenities' },
  { component: Step6_Photos, group: 2, title: 'Photos' },
  { component: Step7_Title, group: 2, title: 'Title' },
  { component: Step8_Description, group: 2, title: 'Description' },
  { component: Step9_Booking, group: 3, title: 'Booking' },
  { component: Step10_Price, group: 3, title: 'Pricing' },
  { component: Step11_Discounts, group: 3, title: 'Discounts' },
  { component: Step12_Legal, group: 3, title: 'Legal' },
  { component: Step13_Review, group: 3, title: 'Review & Publish' },
];

const stepGroups = [
  { number: 1, title: 'Tell us about your place' },
  { number: 2, title: 'Make it stand out' },
  { number: 3, title: 'Finish up and publish' },
];

export default function CreateListingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  
  const userDocRef = useMemoFirebase(
    () => (user && firestore) ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserType>(userDocRef);

  const initialDraft = React.useMemo(() => {
    if (userProfile?.residentialAddress) {
      return { residentialAddress: userProfile.residentialAddress };
    }
    return {};
  }, [userProfile]);

  const {
    currentStep,
    totalSteps,
    goToNextStep,
    goToPrevStep,
    isFirstStep,
    isLastStep,
    setFormData,
    formData,
    clearDraft
  } = useHostOnboarding(steps.length, initialDraft);
  
  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>;
  }

  if (!user) {
    router.push('/login');
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12" /></div>;
  }

  const CurrentStepComponent = steps[currentStep - 1].component;
  
  const isStepValid = () => {
    switch (currentStep) {
      case 1: return !!formData.propertyType;
      case 2: return !!formData.guestSpace;
      case 3: return !!formData.location?.trim();
      case 4: return formData.maxGuests > 0 && formData.beds > 0 && formData.bathrooms > 0 && !!formData.bathroomType;
      case 5: return formData.amenities?.length > 0;
      case 6: return formData.images?.length > 0;
      case 7: return !!formData.title?.trim();
      case 8: return !!formData.description?.trim();
      case 9: return !!formData.bookingSettings;
      case 10: return formData.pricePerNight > 0;
      case 12: return !!formData.residentialAddress?.country && !!formData.residentialAddress?.street && !!formData.residentialAddress?.city && !!formData.hostingAsBusiness;
      default: return true; // For optional steps like discounts or the final review
    }
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-screen">
      <aside className="hidden md:flex flex-col border-r bg-muted/20 p-6">
        <Link href="/" className="font-bold text-lg mb-8">StayNest</Link>
        <nav className="flex flex-col gap-4">
          {stepGroups.map(group => (
            <div key={group.number}>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3 px-2">Step {group.number}: {group.title}</h3>
              <ul className="space-y-1">
                {steps.filter(s => s.group === group.number).map((step) => {
                  const stepIndex = steps.findIndex(s => s.title === step.title);
                  const isCompleted = stepIndex < currentStep - 1;
                  const isActive = stepIndex === currentStep - 1;
                  return (
                    <li key={step.title} className={`flex items-center gap-3 px-2 py-1.5 rounded-md text-sm ${isActive ? 'bg-primary/10 text-primary-foreground font-semibold' : 'text-muted-foreground'}`}>
                      {isCompleted ? <Check className="w-4 h-4 text-green-500" /> : <div className={`w-4 h-4 rounded-full border-2 ${isActive ? 'border-primary' : 'border-muted-foreground/50'}`} />}
                      <span>{step.title}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      
      <main className="flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-16 px-4">
            <CurrentStepComponent 
              setFormData={setFormData} 
              formData={formData} 
              clearDraft={clearDraft}
            />
          </div>
        </div>

        <footer className="border-t sticky bottom-0 bg-background/95 p-4">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <Button variant="outline" onClick={goToPrevStep} disabled={isFirstStep}>
              Back
            </Button>
            <div className="w-40">
              <div className="bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${(currentStep / totalSteps) * 100}%` }}/>
              </div>
            </div>
            <Button onClick={isLastStep ? () => {} : goToNextStep} disabled={isLastStep || !isStepValid()}>
              {currentStep === totalSteps - 1 ? 'Review' : 'Next'}
            </Button>
          </div>
        </footer>
      </main>
    </div>
  );
}
