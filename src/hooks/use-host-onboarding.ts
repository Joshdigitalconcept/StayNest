'use client';

import { useState, useEffect, useCallback } from 'react';

const LOCAL_STORAGE_KEY = 'hostOnboardingDraft';

export function useHostOnboarding(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    try {
      const savedDraft = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedDraft ? JSON.parse(savedDraft) : {};
    } catch (error) {
      console.error("Failed to parse draft from localStorage", error);
      return {};
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error("Failed to save draft to localStorage", error);
    }
  }, [formData]);

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
    try {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
        console.error("Failed to remove draft from localStorage", error);
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
