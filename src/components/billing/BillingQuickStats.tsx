import { Clock, Calendar, CalendarDays } from 'lucide-react';

interface PeriodStats {
  count: number;
  totalCollected: number;
  recoveryRate: number;
}

interface BillingQuickStatsProps {
  todayStats: PeriodStats;
  weekStats: PeriodStats;
  monthStats: PeriodStats;
  onPeriodClick?: (period: 'today' | 'week' | 'month') => void;
}

export function BillingQuickStats({
  todayStats,
  weekStats,
  monthStats,
  onPeriodClick
}: BillingQuickStatsProps) {
  const formatCurrency = (amount: number) => `${amount.toFixed(2)} USD`;

  const periods = [
    {
      key: 'today' as const,
      icon: Clock,
      label: "Aujourd'hui",
      stats: todayStats,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      key: 'week' as const,
      icon: Calendar,
      label: 'Cette Semaine',
      stats: weekStats,
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      key: 'month' as const,
      icon: CalendarDays,
      label: 'Ce Mois',
      stats: monthStats,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques Rapides</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {periods.map((period) => {
          const Icon = period.icon;
          const isClickable = !!onPeriodClick;

          return (
            <div
              key={period.key}
              onClick={() => isClickable && onPeriodClick(period.key)}
              className={`${period.color} border-2 rounded-lg p-4 transition-all ${
                isClickable ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-gray-700" />
                <span className="font-semibold text-gray-900">{period.label}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Factures</span>
                  <span className="text-sm font-bold text-gray-900">{period.stats.count}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Collecté</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(period.stats.totalCollected)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Taux récup.</span>
                  <span className={`text-sm font-bold ${
                    period.stats.recoveryRate >= 85 ? 'text-green-600' :
                    period.stats.recoveryRate >= 70 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {period.stats.recoveryRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-600">Total Factures</div>
            <div className="text-xl font-bold text-gray-900">
              {todayStats.count + weekStats.count + monthStats.count}
            </div>
          </div>
          <div className="border-l border-r border-gray-200">
            <div className="text-gray-600">Total Collecté</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(todayStats.totalCollected + weekStats.totalCollected + monthStats.totalCollected)}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Taux Moyen</div>
            <div className="text-xl font-bold text-blue-600">
              {((todayStats.recoveryRate + weekStats.recoveryRate + monthStats.recoveryRate) / 3).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
