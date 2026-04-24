import { motion } from 'framer-motion';
import { ClipboardList, CreditCard, Clock, Stethoscope, Check } from 'lucide-react';

interface BookingStepperProps {
  currentStep: number;
}

const steps = [
  { label: 'Inscription', icon: ClipboardList },
  { label: 'Paiement', icon: CreditCard },
  { label: "Salle d'attente", icon: Clock },
  { label: 'Consultation', icon: Stethoscope },
];

export function BookingStepper({ currentStep }: BookingStepperProps) {
  return (
    <div className="w-full px-2 sm:px-0">
      <div className="flex items-center justify-between relative">
        {/* Background connector line */}
        <div className="absolute top-6 left-[10%] right-[10%] h-[2px] bg-gray-200 -z-0" />
        <motion.div
          className="absolute top-6 left-[10%] h-[2px] bg-gradient-to-r from-medical-500 to-medical-600 -z-0 origin-left"
          initial={{ width: '0%' }}
          animate={{
            width: `${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 80)}%`,
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = currentStep === stepNum;
          const isComplete = currentStep > stepNum;
          const Icon = step.icon;

          return (
            <div key={step.label} className="flex flex-col items-center relative z-10 flex-1">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.15 : 1,
                  backgroundColor: isComplete
                    ? '#3B82F6'
                    : isActive
                    ? '#0F172A'
                    : '#e5e7eb',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="w-12 h-12 rounded-full flex items-center justify-center relative"
              >
                {isComplete ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}
                  />
                )}

                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-medical-500"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>

              <motion.span
                className={`text-xs mt-2 font-semibold text-center leading-tight ${
                  isActive
                    ? 'text-navy-800'
                    : isComplete
                    ? 'text-medical-600'
                    : 'text-gray-400'
                }`}
                animate={{ opacity: isActive || isComplete ? 1 : 0.6 }}
              >
                {step.label}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
