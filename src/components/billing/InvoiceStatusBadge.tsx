import { CheckCircle, Clock, AlertCircle, XCircle, FileEdit } from 'lucide-react';

type InvoiceStatus = 'draft' | 'pending' | 'partial' | 'paid' | 'cancelled';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus | string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { label: string; classes: string; Icon: React.ElementType }> = {
  draft: {
    label: 'Brouillon',
    classes: 'bg-gray-100 text-gray-700 border-gray-300',
    Icon: FileEdit,
  },
  pending: {
    label: 'En attente',
    classes: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Icon: Clock,
  },
  partial: {
    label: 'Partiel',
    classes: 'bg-orange-100 text-orange-800 border-orange-300',
    Icon: AlertCircle,
  },
  paid: {
    label: 'Payée',
    classes: 'bg-green-100 text-green-800 border-green-300',
    Icon: CheckCircle,
  },
  cancelled: {
    label: 'Annulée',
    classes: 'bg-red-100 text-red-800 border-red-300',
    Icon: XCircle,
  },
};

export function InvoiceStatusBadge({ status, size = 'sm' }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    classes: 'bg-gray-100 text-gray-700 border-gray-300',
    Icon: AlertCircle,
  };

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 ${padding} ${textSize} font-semibold rounded-full border ${config.classes}`}>
      <config.Icon className={iconSize} />
      {config.label}
    </span>
  );
}
