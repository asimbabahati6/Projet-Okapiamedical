import { Calendar } from 'lucide-react';
import { PeriodFilter, getPeriodLabel } from '../../utils/billingPeriodFilters';

interface PeriodFilterBarProps {
  selectedPeriod: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  invoiceCount?: number;
}

export function PeriodFilterBar({
  selectedPeriod,
  onPeriodChange,
  customStartDate = '',
  customEndDate = '',
  onCustomDateChange,
  invoiceCount = 0
}: PeriodFilterBarProps) {
  const periods: { value: PeriodFilter; label: string }[] = [
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: '7 Jours' },
    { value: 'month', label: '30 Jours' },
    { value: 'all', label: 'Tout' },
  ];

  const handleCustomApply = () => {
    if (customStartDate && customEndDate && onCustomDateChange) {
      onCustomDateChange(customStartDate, customEndDate);
      onPeriodChange('custom');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Période:</span>
        </div>

        <div className="flex gap-2">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => onPeriodChange(period.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === period.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {onCustomDateChange && (
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => onCustomDateChange(e.target.value, customEndDate)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-500">→</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => onCustomDateChange(customStartDate, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleCustomApply}
              disabled={!customStartDate || !customEndDate}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Appliquer
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Affichage: <span className="font-medium text-gray-900">{getPeriodLabel(selectedPeriod)}</span>
        </span>
        <span className="text-gray-500">
          {invoiceCount} facture{invoiceCount > 1 ? 's' : ''} dans cette période
        </span>
      </div>
    </div>
  );
}
