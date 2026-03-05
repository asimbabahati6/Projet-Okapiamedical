import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface FinancialKPICardProps {
  title: string;
  value: number;
  trend?: number;
  icon: LucideIcon;
  formatAsCurrency?: boolean;
  formatAsPercentage?: boolean;
  className?: string;
}

export function FinancialKPICard({
  title,
  value,
  trend,
  icon: Icon,
  formatAsCurrency = true,
  formatAsPercentage = false,
  className = '',
}: FinancialKPICardProps) {
  const formatValue = (val: number): string => {
    if (formatAsPercentage) {
      return `${val.toFixed(1)}%`;
    }
    if (formatAsCurrency) {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return val.toLocaleString('en-US');
  };

  const getTrendColor = (trendValue?: number): string => {
    if (trendValue === undefined || trendValue === 0) return 'text-gray-500';
    return trendValue > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (trendValue?: number) => {
    if (trendValue === undefined || trendValue === 0) return null;
    return trendValue > 0 ? TrendingUp : TrendingDown;
  };

  const TrendIcon = getTrendIcon(trend);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        {trend !== undefined && TrendIcon && (
          <div className={`flex items-center gap-1 ${getTrendColor(trend)}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
      {trend !== undefined && (
        <p className="text-xs text-gray-500 mt-2">vs période précédente</p>
      )}
    </div>
  );
}
