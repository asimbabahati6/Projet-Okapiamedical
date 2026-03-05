import { BillingStatistics, PeriodType } from '../../../types/billingAnalytics';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BillingSummaryTableProps {
  dayStats: BillingStatistics;
  weekStats: BillingStatistics;
  monthStats: BillingStatistics;
  onPeriodClick?: (period: PeriodType) => void;
}

export function BillingSummaryTable({
  dayStats,
  weekStats,
  monthStats,
  onPeriodClick
}: BillingSummaryTableProps) {
  const rows = [
    { label: 'Aujourd\'hui', stats: dayStats, period: 'today' as PeriodType },
    { label: 'Cette Semaine (7j)', stats: weekStats, period: 'week' as PeriodType },
    { label: 'Ce Mois (30j)', stats: monthStats, period: 'month' as PeriodType },
  ];

  function formatCurrency(amount: number): string {
    return `${amount.toFixed(2)} USD`;
  }

  function getRecoveryRateColor(rate: number): string {
    if (rate >= 90) return 'text-green-700 bg-green-100';
    if (rate >= 75) return 'text-blue-700 bg-blue-100';
    if (rate >= 60) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  }

  function getRecoveryRateIcon(rate: number) {
    if (rate >= 85) return <TrendingUp className="w-4 h-4" />;
    if (rate >= 70) return <Minus className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Tableau Récapitulatif par Période</h3>
        <p className="text-sm text-gray-600 mt-1">Vue d'ensemble des performances de facturation</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Période
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Factures Émises
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Factures Payées
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant Collecté
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Solde Impayé
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Taux de Recouvrement
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row, index) => (
              <tr
                key={index}
                onClick={() => onPeriodClick?.(row.period)}
                className={`hover:bg-gray-50 transition-colors ${onPeriodClick ? 'cursor-pointer' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{row.label}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900">{row.stats.invoicesCount.total}</div>
                  <div className="text-xs text-gray-500">
                    {row.stats.invoicesCount.pending} en attente
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-green-600">
                    {row.stats.invoicesCount.paid}
                  </div>
                  <div className="text-xs text-gray-500">
                    {row.stats.invoicesCount.partial > 0 && `${row.stats.invoicesCount.partial} partielles`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(row.stats.totalCollected)}
                  </div>
                  <div className="text-xs text-gray-500">
                    sur {formatCurrency(row.stats.totalInvoiced)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-orange-600">
                    {formatCurrency(row.stats.totalPending)}
                  </div>
                  {row.stats.totalOverdue > 0 && (
                    <div className="text-xs text-red-600">
                      {formatCurrency(row.stats.totalOverdue)} en retard
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getRecoveryRateColor(row.stats.recoveryRate)}`}>
                      {getRecoveryRateIcon(row.stats.recoveryRate)}
                      {row.stats.recoveryRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={6} className="px-6 py-3">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Délai moyen de paiement: <span className="font-medium">{monthStats.averagePaymentDelay.toFixed(1)} jours</span>
                  </span>
                  <span>
                    Paiement moyen: <span className="font-medium">{formatCurrency(monthStats.averagePaymentAmount)}</span>
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="text-center">
            <div className="text-gray-600">Total Facturé (30j)</div>
            <div className="font-semibold text-gray-900 mt-1">{formatCurrency(monthStats.totalInvoiced)}</div>
          </div>
          <div className="text-center border-l border-r border-gray-300">
            <div className="text-gray-600">Total Collecté (30j)</div>
            <div className="font-semibold text-green-600 mt-1">{formatCurrency(monthStats.totalCollected)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">Total Impayé (30j)</div>
            <div className="font-semibold text-orange-600 mt-1">{formatCurrency(monthStats.totalPending)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
