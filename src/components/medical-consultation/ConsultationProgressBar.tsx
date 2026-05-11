import { UserCheck, Stethoscope, ClipboardCheck, CheckCircle2 } from 'lucide-react';

export type WorkflowStatus = 'nurse_pending' | 'nurse_in_progress' | 'awaiting_doctor' | 'doctor_in_progress' | 'completed';

interface ConsultationProgressBarProps {
  status: WorkflowStatus;
}

const STEPS = [
  { key: 'reception', label: 'Accueil', icon: UserCheck },
  { key: 'nurse', label: 'Infirmier', icon: ClipboardCheck },
  { key: 'doctor', label: 'Médecin', icon: Stethoscope },
  { key: 'done', label: 'Terminé', icon: CheckCircle2 },
];

function getActiveStep(status: WorkflowStatus): number {
  switch (status) {
    case 'nurse_pending': return 0;
    case 'nurse_in_progress': return 1;
    case 'awaiting_doctor': return 2;
    case 'doctor_in_progress': return 2;
    case 'completed': return 3;
    default: return 0;
  }
}

export function ConsultationProgressBar({ status }: ConsultationProgressBarProps) {
  const activeStep = getActiveStep(status);

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index < activeStep;
        const isActive = index === activeStep;
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-teal-600 text-white shadow-sm'
                    : isActive
                      ? 'bg-teal-100 text-teal-700 border-2 border-teal-500 shadow-sm'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[11px] mt-1.5 font-medium ${
                isCompleted ? 'text-teal-700' : isActive ? 'text-teal-600' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 mx-2 mt-[-18px]">
                <div className={`h-0.5 rounded-full transition-all ${
                  isCompleted ? 'bg-teal-500' : 'bg-gray-200'
                }`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
