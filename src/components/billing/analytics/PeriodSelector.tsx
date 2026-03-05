import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { PeriodType } from '../../../types/billingAnalytics';

interface PeriodSelectorProps {
  selectedPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (startDate: Date, endDate: Date) => void;
}

export function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}: PeriodSelectorProps) {
  const periods: { value: PeriodType; label: string; icon: React.ReactNode }[] = [
    { value: 'today', label: 'Aujourd\'hui', icon: <Calendar className="w-4 h-4" /> },
    { value: 'week', label: '7 Derniers Jours', icon: <CalendarDays className="w-4 h-4" /> },
    { value: 'month', label: '30 Derniers Jours', icon: <CalendarRange className="w-4 h-4" /> },
    { value: 'custom', label: 'Personnalisé', icon: <CalendarRange className="w-4 h-4" /> },
  ];

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              selectedPeriod === period.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {period.icon}
            {period.label}
          </button>
        ))}
      </div>

      {selectedPeriod === 'custom' && onCustomDateChange && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Sélectionner une période personnalisée</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date de début</label>
              <input
                type="date"
                value={customStartDate ? formatDateForInput(customStartDate) : ''}
                onChange={(e) => {
                  const newStart = new Date(e.target.value);
                  if (customEndDate) {
                    onCustomDateChange(newStart, customEndDate);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date de fin</label>
              <input
                type="date"
                value={customEndDate ? formatDateForInput(customEndDate) : ''}
                onChange={(e) => {
                  const newEnd = new Date(e.target.value);
                  if (customStartDate) {
                    onCustomDateChange(customStartDate, newEnd);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
