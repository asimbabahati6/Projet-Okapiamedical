import { Check, Lock, User, GraduationCap, MapPin, Briefcase, CreditCard, Phone, FileCheck } from 'lucide-react';
import { StepNumber, STEP_NAMES } from '../../types/employeeForm';

interface StepIndicatorProps {
  currentStep: StepNumber;
  completedSteps: StepNumber[];
  onStepClick: (step: StepNumber) => void;
  errorCounts: Record<number, number>;
}

const STEP_ICONS = {
  1: User,
  2: GraduationCap,
  3: MapPin,
  4: Briefcase,
  5: CreditCard,
  6: Phone,
  7: FileCheck,
};

export function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
  errorCounts,
}: StepIndicatorProps) {
  const steps: StepNumber[] = [1, 2, 3, 4, 5, 6, 7];

  const getStepStatus = (step: StepNumber): 'completed' | 'current' | 'locked' | 'available' => {
    if (completedSteps.includes(step)) return 'completed';
    if (step === currentStep) return 'current';
    if (step > currentStep && !completedSteps.includes((step - 1) as StepNumber)) return 'locked';
    return 'available';
  };

  const canClickStep = (step: StepNumber): boolean => {
    const status = getStepStatus(step);
    return status !== 'locked';
  };

  return (
    <div className="w-full px-4 py-6 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step);
            const Icon = STEP_ICONS[step];
            const isClickable = canClickStep(step);
            const errorCount = errorCounts[step] || 0;

            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => isClickable && onStepClick(step)}
                    disabled={!isClickable}
                    className={`
                      relative flex items-center justify-center w-12 h-12 rounded-full
                      transition-all duration-200 mb-2
                      ${
                        status === 'completed'
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : status === 'current'
                          ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                          : status === 'locked'
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-600 hover:bg-gray-400 cursor-pointer'
                      }
                    `}
                    aria-label={`Étape ${step}: ${STEP_NAMES[step]}`}
                    aria-current={status === 'current' ? 'step' : undefined}
                  >
                    {status === 'completed' ? (
                      <Check className="w-6 h-6" />
                    ) : status === 'locked' ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                    {errorCount > 0 && status !== 'completed' && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {errorCount}
                      </span>
                    )}
                  </button>

                  <span
                    className={`
                      text-xs text-center font-medium max-w-[100px]
                      ${
                        status === 'current'
                          ? 'text-blue-600 font-semibold'
                          : status === 'completed'
                          ? 'text-green-600'
                          : status === 'locked'
                          ? 'text-gray-400'
                          : 'text-gray-600'
                      }
                    `}
                  >
                    {STEP_NAMES[step]}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mb-8">
                    <div
                      className={`h-full ${
                        completedSteps.includes(step)
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
