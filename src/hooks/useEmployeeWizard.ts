import { useState, useCallback } from 'react';
import {
  EmployeeFormData,
  INITIAL_FORM_DATA,
  StepNumber,
  ValidationError,
} from '../types/employeeForm';
import {
  validatePersonalInfo,
  validateAcademicBackground,
  validateContactDetails,
  validateProfessionalInfo,
  validateBankingInfo,
  validateEmergencyContact,
} from '../validation/employeeValidation';

export function useEmployeeWizard(initialData?: EmployeeFormData) {
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [formData, setFormData] = useState<EmployeeFormData>(initialData || INITIAL_FORM_DATA);
  const [completedSteps, setCompletedSteps] = useState<StepNumber[]>([]);
  const [stepErrors, setStepErrors] = useState<Record<number, ValidationError[]>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const validateStep = useCallback((step: StepNumber): ValidationError[] => {
    let errors: ValidationError[] = [];

    switch (step) {
      case 1:
        errors = validatePersonalInfo(formData.personalInfo);
        break;
      case 2:
        errors = validateAcademicBackground(
          formData.academicBackground,
          formData.professionalInfo.hireDate
        );
        break;
      case 3:
        errors = validateContactDetails(formData.contactDetails);
        break;
      case 4:
        errors = validateProfessionalInfo(
          formData.professionalInfo,
          formData.personalInfo.dateOfBirth
        );
        break;
      case 5:
        errors = validateBankingInfo(formData.bankingInfo);
        break;
      case 6:
        errors = validateEmergencyContact(formData.emergencyContact);
        break;
      case 7:
        errors = [];
        break;
    }

    setStepErrors((prev) => ({ ...prev, [step]: errors }));
    return errors;
  }, [formData]);

  const canProceedToStep = useCallback((targetStep: StepNumber): boolean => {
    if (targetStep <= currentStep) return true;

    if (targetStep === (currentStep + 1) as StepNumber) {
      const errors = validateStep(currentStep);
      return errors.length === 0;
    }

    return completedSteps.includes(targetStep);
  }, [currentStep, completedSteps, validateStep]);

  const goToStep = useCallback((targetStep: StepNumber) => {
    if (targetStep <= 7 && targetStep >= 1) {
      if (targetStep > currentStep) {
        const errors = validateStep(currentStep);
        if (errors.length === 0) {
          if (!completedSteps.includes(currentStep)) {
            setCompletedSteps((prev) => [...prev, currentStep]);
          }
          setCurrentStep(targetStep);
        }
      } else {
        setCurrentStep(targetStep);
      }
    }
  }, [currentStep, validateStep, completedSteps]);

  const nextStep = useCallback(() => {
    const errors = validateStep(currentStep);

    if (errors.length === 0) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }

      if (currentStep < 7) {
        setCurrentStep((currentStep + 1) as StepNumber);
      }
    } else {
      setHasAttemptedSubmit(true);
    }
  }, [currentStep, validateStep, completedSteps]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as StepNumber);
    }
  }, [currentStep]);

  const updateFormData = useCallback((section: keyof EmployeeFormData, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setCurrentStep(1);
    setCompletedSteps([]);
    setStepErrors({});
    setHasAttemptedSubmit(false);
  }, []);

  const loadFormData = useCallback((data: EmployeeFormData, step?: StepNumber, completed?: StepNumber[]) => {
    setFormData(data);
    if (step) setCurrentStep(step);
    if (completed) setCompletedSteps(completed);
  }, []);

  const isStepComplete = useCallback((step: StepNumber): boolean => {
    return completedSteps.includes(step);
  }, [completedSteps]);

  const getStepErrors = useCallback((step: StepNumber): ValidationError[] => {
    return stepErrors[step] || [];
  }, [stepErrors]);

  return {
    currentStep,
    formData,
    completedSteps,
    stepErrors,
    hasAttemptedSubmit,
    validateStep,
    canProceedToStep,
    goToStep,
    nextStep,
    previousStep,
    updateFormData,
    resetForm,
    loadFormData,
    isStepComplete,
    getStepErrors,
  };
}
