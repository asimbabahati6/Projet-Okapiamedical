import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X, CreditCard, Stethoscope, ClipboardCheck } from 'lucide-react';

interface SMSToast {
  id: string;
  type: 'payment' | 'doctor_call' | 'registration';
  message: string;
  detail?: string;
}

interface SMSNotificationToastProps {
  toasts: SMSToast[];
  onDismiss: (id: string) => void;
}

export function SMSNotificationToast({ toasts, onDismiss }: SMSNotificationToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <SMSToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const toastConfig = {
  payment: {
    Icon: CreditCard,
    borderColor: 'border-l-green-500',
    iconBg: 'bg-green-100 text-green-600',
    barColor: 'bg-green-500',
  },
  doctor_call: {
    Icon: Stethoscope,
    borderColor: 'border-l-medical-500',
    iconBg: 'bg-medical-100 text-medical-600',
    barColor: 'bg-medical-500',
  },
  registration: {
    Icon: ClipboardCheck,
    borderColor: 'border-l-sky-500',
    iconBg: 'bg-sky-100 text-sky-600',
    barColor: 'bg-sky-500',
  },
};

function SMSToastItem({
  toast,
  onDismiss,
}: {
  toast: SMSToast;
  onDismiss: (id: string) => void;
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 8000;
    const interval = 50;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return prev - step;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [toast.id, onDismiss]);

  const config = toastConfig[toast.type];
  const { Icon } = config;

  return (
    <motion.div
      layout
      initial={{ x: 300, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 300, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="pointer-events-auto"
    >
      <div
        className={`glass-card rounded-2xl overflow-hidden shadow-xl border-l-4 ${config.borderColor}`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}
            >
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  SMS
                </span>
              </div>
              <p className="text-sm font-semibold text-navy-800 leading-snug">
                {toast.message}
              </p>
              {toast.detail && (
                <p className="text-xs text-gray-500 mt-1">{toast.detail}</p>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="h-0.5 bg-gray-100">
          <motion.div
            className={`h-full ${config.barColor}`}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export type { SMSToast };
