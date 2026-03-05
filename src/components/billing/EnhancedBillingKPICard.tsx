import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface EnhancedBillingKPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'yellow' | 'green' | 'orange' | 'blue' | 'red';
  change?: number;
  showTrend?: boolean;
  subtitle?: string;
}

export function EnhancedBillingKPICard({
  title,
  value,
  icon: Icon,
  color,
  change,
  showTrend = false,
  subtitle
}: EnhancedBillingKPICardProps) {
  const colorClasses = {
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
  };

  const getTrendIcon = () => {
    if (!change || change === 0) return <Minus className="w-4 h-4" />;
    return change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!change || change === 0) return 'text-gray-600 bg-gray-100';
    return change > 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
  };

  const formatChange = (val: number) => {
    const abs = Math.abs(val);
    const sign = val > 0 ? '+' : val < 0 ? '' : '';
    return `${sign}${abs.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${colorClasses[color]} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      {showTrend && change !== undefined && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getTrendColor()}`}>
            {getTrendIcon()}
            {formatChange(change)}
          </span>
          <span className="text-xs text-gray-500">vs période précédente</span>
        </div>
      )}
    </div>
  );
}
