import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface StockAlertBadgeProps {
  currentStock: number;
  minimumStock: number;
  expiryDate?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StockAlertBadge({
  currentStock,
  minimumStock,
  expiryDate,
  size = 'md'
}: StockAlertBadgeProps) {
  const isLowStock = currentStock <= minimumStock;
  const isOutOfStock = currentStock === 0;

  let isExpiringSoon = false;
  let daysUntilExpiry = 0;

  if (expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (isOutOfStock) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} bg-red-100 text-red-800 rounded-full font-semibold border border-red-300 shadow-sm`}>
        <AlertCircle className={iconSizes[size]} />
        Rupture de Stock
      </span>
    );
  }

  if (isLowStock) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} bg-red-100 text-red-800 rounded-full font-semibold border border-red-300 shadow-sm animate-pulse`}>
        <AlertTriangle className={iconSizes[size]} />
        Stock Bas ({currentStock})
      </span>
    );
  }

  if (isExpiringSoon) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} bg-yellow-100 text-yellow-800 rounded-full font-semibold border border-yellow-300 shadow-sm`}>
        <AlertTriangle className={iconSizes[size]} />
        Expire dans {daysUntilExpiry}j
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} bg-green-100 text-green-800 rounded-full font-medium border border-green-300`}>
      <CheckCircle className={iconSizes[size]} />
      Stock OK
    </span>
  );
}

interface MultipleAlertsBadgeProps {
  alerts: Array<{
    type: 'low_stock' | 'expiring' | 'out_of_stock';
    count: number;
  }>;
}

export function MultipleAlertsBadge({ alerts }: MultipleAlertsBadgeProps) {
  const outOfStock = alerts.find(a => a.type === 'out_of_stock')?.count || 0;
  const lowStock = alerts.find(a => a.type === 'low_stock')?.count || 0;
  const expiring = alerts.find(a => a.type === 'expiring')?.count || 0;

  if (outOfStock === 0 && lowStock === 0 && expiring === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {outOfStock > 0 && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-full font-semibold border border-red-300 shadow-sm text-sm">
          <AlertCircle className="w-4 h-4" />
          {outOfStock} Rupture{outOfStock > 1 ? 's' : ''}
        </span>
      )}

      {lowStock > 0 && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full font-semibold border border-orange-300 shadow-sm text-sm animate-pulse">
          <AlertTriangle className="w-4 h-4" />
          {lowStock} Stock{lowStock > 1 ? 's' : ''} Bas
        </span>
      )}

      {expiring > 0 && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full font-semibold border border-yellow-300 shadow-sm text-sm">
          <AlertTriangle className="w-4 h-4" />
          {expiring} Proche{expiring > 1 ? 's' : ''} Péremption
        </span>
      )}
    </div>
  );
}
