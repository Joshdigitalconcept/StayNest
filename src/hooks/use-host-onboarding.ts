'use client';

import { useState, useEffect, useCallback } from 'react';

const LOCAL_STORAGE_KEY = 'hostOnboardingDraft';

export function useHostOnboarding(totalSteps: number, initialDraft = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialDraft);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage safely after mount to prevent SSR errors
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedDraft = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDraft) {
        setFormData(JSON.parse(savedDraft));
      }
    } catch (error) {
      console.error("Failed to parse draft from localStorage", error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Sync to initialDraft if formData is still empty (e.g. waiting for profile)
  useEffect(() => {
    if (isInitialized && Object.keys(formData).length === 0 && Object.keys(initialDraft).length > 0) {
        setFormData(initialDraft);
    }
  }, [initialDraft, formData, isInitialized]);

  // Persist changes to localStorage
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error("Failed to save draft to localStorage", error);
    }
  }, [formData, isInitialized]);

  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => (prev < totalSteps ? prev + 1 : prev));
  }, [totalSteps]);

  const goToPrevStep = useCallback(() => {
    setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev));
  }, []);
  
  const goToStep = useCallback((step: number) => {
    if (step > 0 && step <= totalSteps) {
        setCurrentStep(step);
    }
  }, [totalSteps]);

  const updateFormData = useCallback((newData: object) => {
    setFormData((prev: object) => ({ ...prev, ...newData }));
  }, []);
  
  const clearDraft = useCallback(() => {
    setFormData({});
    setCurrentStep(1);
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (error) {
            console.error("Failed to remove draft from localStorage", error);
        }
    }
  }, []);

  return {
    currentStep,
    totalSteps,
    formData,
    setFormData: updateFormData,
    goToNextStep,
    goToPrevStep,
    goToStep,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps,
    clearDraft
  };
}
