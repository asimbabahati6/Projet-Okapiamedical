import { Check, X, AlertCircle, Clock, Loader2 } from 'lucide-react';

type StatusType = 'active' | 'inactive' | 'pending' | 'warning' | 'error' | 'loading';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { color: string; bgColor: string; icon: any; text: string }
> = {
  active: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: Check,
    text: 'Actif',
  },
  inactive: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: X,
    text: 'Inactif',
  },
  pending: {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: Clock,
    text: 'En attente',
  },
  warning: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: AlertCircle,
    text: 'Attention',
  },
  error: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: X,
    text: 'Erreur',
  },
  loading: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: Loader2,
    text: 'Chargement',
  },
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function StatusIndicator({
  status,
  label,
  size = 'md',
  showIcon = true,
  className = '',
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.text;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && (
        <Icon
          className={`${iconSizes[size]} ${status === 'loading' ? 'animate-spin' : ''}`}
        />
      )}
      <span>{displayLabel}</span>
    </div>
  );
}
