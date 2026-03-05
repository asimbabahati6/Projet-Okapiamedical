import { TrendingUp, TrendingDown, DollarSign, Clock, Percent, CreditCard, AlertCircle } from 'lucide-react';
import { BillingStatistics, PeriodComparison } from '../../../types/billingAnalytics';
import { formatCurrency, formatPercentage, formatNumber } from '../../../utils/billingCalculations';

interface BillingKPICardsProps {
  statistics: BillingStatistics;
  comparison?: PeriodComparison;
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  change?: number;
  changePercentage?: number;
  subtitle?: string;
}

function KPICard({ title, value, icon, bgColor, iconColor, change, changePercentage, subtitle }: KPICardProps) {
  const hasPositiveChange = change !== undefined && change >= 0;
  const showChange = change !== undefined && changePercentage !== undefined;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${bgColor} w-14 h-14 rounded-lg flex items-center justify-center`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
      </div>

      {showChange && (
        <div className="flex items-center gap-2">
          {hasPositiveChange ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm font-medium ${hasPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
            {hasPositiveChange ? '+' : ''}{formatPercentage(changePercentage!)}
          </span>
          <span className="text-xs text-gray-500">
            vs période précédente
          </span>
        </div>
      )}
    </div>
  );
}

export function BillingKPICards({ statistics, comparison }: BillingKPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <KPICard
        title="Total Facturé"
        value={formatCurrency(statistics.totalInvoiced)}
        icon={<DollarSign className="w-7 h-7" />}
        bgColor="bg-blue-100"
        iconColor="text-blue-600"
        change={comparison?.change.totalInvoiced}
        changePercentage={comparison?.changePercentage.totalInvoiced}
        subtitle={`${statistics.invoicesCount.total} factures`}
      />

      <KPICard
        title="Montant Collecté"
        value={formatCurrency(statistics.totalCollected)}
        icon={<CreditCard className="w-7 h-7" />}
        bgColor="bg-green-100"
        iconColor="text-green-600"
        change={comparison?.change.totalCollected}
        changePercentage={comparison?.changePercentage.totalCollected}
        subtitle={`${statistics.invoicesCount.paid} factures payées`}
      />

      <KPICard
        title="Solde Impayé"
        value={formatCurrency(statistics.totalPending)}
        icon={<AlertCircle className="w-7 h-7" />}
        bgColor="bg-orange-100"
        iconColor="text-orange-600"
        subtitle={`${statistics.invoicesCount.pending + statistics.invoicesCount.partial} factures`}
      />

      <KPICard
        title="Taux de Recouvrement"
        value={formatPercentage(statistics.recoveryRate)}
        icon={<Percent className="w-7 h-7" />}
        bgColor={statistics.recoveryRate >= 75 ? 'bg-green-100' : 'bg-red-100'}
        iconColor={statistics.recoveryRate >= 75 ? 'text-green-600' : 'text-red-600'}
        change={comparison?.change.recoveryRate}
        changePercentage={comparison?.changePercentage.recoveryRate}
      />

      <KPICard
        title="Moyenne par Facture"
        value={formatCurrency(statistics.averagePaymentAmount)}
        icon={<DollarSign className="w-7 h-7" />}
        bgColor="bg-purple-100"
        iconColor="text-purple-600"
        change={comparison?.change.averagePayment}
        changePercentage={comparison?.changePercentage.averagePayment}
      />

      <KPICard
        title="Délai Moyen de Paiement"
        value={`${Math.round(statistics.averagePaymentDelay)} jours`}
        icon={<Clock className="w-7 h-7" />}
        bgColor="bg-yellow-100"
        iconColor="text-yellow-600"
      />

      <KPICard
        title="Factures en Retard"
        value={formatCurrency(statistics.totalOverdue)}
        icon={<AlertCircle className="w-7 h-7" />}
        bgColor="bg-red-100"
        iconColor="text-red-600"
        subtitle="Plus de 30 jours"
      />

      <KPICard
        title="Factures Annulées"
        value={formatCurrency(statistics.totalCancelled)}
        icon={<DollarSign className="w-7 h-7" />}
        bgColor="bg-gray-100"
        iconColor="text-gray-600"
        subtitle={`${statistics.invoicesCount.cancelled} factures`}
      />
    </div>
  );
}
