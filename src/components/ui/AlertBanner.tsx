import { ReactNode } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'danger' | 'critical';

interface AlertBannerProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig: Record<
  AlertVariant,
  { icon: any; bgColor: string; borderColor: string; textColor: string; iconColor: string }
> = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900',
    iconColor: 'text-blue-500',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-900',
    iconColor: 'text-green-500',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-900',
    iconColor: 'text-orange-500',
  },
  danger: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-900',
    iconColor: 'text-red-600',
  },
  critical: {
    icon: AlertTriangle,
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
    textColor: 'text-red-950',
    iconColor: 'text-red-700',
  },
};

export function AlertBanner({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}: AlertBannerProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`relative rounded-lg border-2 p-4 ${config.bgColor} ${config.borderColor} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon className={`w-5 h-5 ${variant === 'critical' ? 'animate-pulse' : ''}`} />
        </div>

        <div className={`flex-1 ${config.textColor}`}>
          {title && (
            <h3 className="font-bold text-lg mb-1">{title}</h3>
          )}
          <div className="text-sm leading-relaxed">{children}</div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${config.iconColor} hover:opacity-70 transition-opacity`}
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
