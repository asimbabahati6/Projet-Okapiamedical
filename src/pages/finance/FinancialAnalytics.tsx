import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useFinancialAnalytics, PeriodType } from '../../hooks/finance/useFinancialAnalytics';
import { FinancialKPICard } from '../../components/finance/FinancialKPICard';
import { RevenueTrendChart } from '../../components/finance/RevenueTrendChart';
import { ExpenseDistributionChart } from '../../components/finance/ExpenseDistributionChart';
import { RevenueExpenseComparison } from '../../components/finance/RevenueExpenseComparison';
import { FinancialAlertPanel } from '../../components/finance/FinancialAlertPanel';

export default function FinancialAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const startDate = customStartDate ? new Date(customStartDate) : undefined;
  const endDate = customEndDate ? new Date(customEndDate) : undefined;

  const { data, loading, error, refresh } = useFinancialAnalytics({
    period: selectedPeriod,
    startDate,
    endDate,
  });

  const getPeriodLabel = (): string => {
    switch (selectedPeriod) {
      case 'today':
        return "Aujourd'hui";
      case 'week':
        return '7 derniers jours';
      case 'month':
        return '30 derniers jours';
      case 'quarter':
        return '90 derniers jours';
      case 'year':
        return 'Cette année';
      case 'custom':
        return customStartDate && customEndDate
          ? `${new Date(customStartDate).toLocaleDateString('fr-FR')} - ${new Date(customEndDate).toLocaleDateString('fr-FR')}`
          : 'Période personnalisée';
      default:
        return '30 derniers jours';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement des données financières...</p>
          <p className="text-gray-500 text-sm mt-2">Analyse en cours</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <TrendingDown className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-800 font-medium mb-2">Erreur de chargement</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={refresh}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <PieChart className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-yellow-800 font-medium mb-2">Aucune donnée disponible</p>
          <p className="text-yellow-600 text-sm">
            Commencez par créer des factures et des dépenses pour voir les analytics financières
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Analyses Financières Globales
          </h1>
          <p className="text-gray-600 mt-1">
            Vue d'ensemble de la santé financière de la clinique
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Période d'analyse</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { value: 'today', label: "Aujourd'hui" },
            { value: 'week', label: '7 jours' },
            { value: 'month', label: '30 jours' },
            { value: 'quarter', label: '90 jours' },
            { value: 'year', label: 'Année' },
            { value: 'custom', label: 'Personnalisé' },
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value as PeriodType)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {selectedPeriod === 'custom' && (
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Période sélectionnée :</span> {getPeriodLabel()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinancialKPICard
          title="Revenus Totaux"
          value={data.revenue.total}
          trend={data.revenue.trend}
          icon={DollarSign}
        />
        <FinancialKPICard
          title="Dépenses Totales"
          value={data.expenses.total}
          trend={data.expenses.trend}
          icon={TrendingDown}
        />
        <FinancialKPICard
          title="Bénéfice Net"
          value={data.profitLoss.net}
          trend={data.profitLoss.trend}
          icon={TrendingUp}
        />
        <FinancialKPICard
          title="Marge Bénéficiaire"
          value={data.profitLoss.margin}
          icon={PieChart}
          formatAsCurrency={false}
          formatAsPercentage={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendChart data={data.revenue.byPeriod} />
        <ExpenseDistributionChart data={data.expenses.byCategory} />
      </div>

      <RevenueExpenseComparison
        revenueData={data.revenue.byPeriod}
        expenseData={data.expenses.byPeriod}
      />

      <FinancialAlertPanel
        cashBalance={data.cashFlow.balance}
        expensesTrend={data.expenses.trend}
        profitMargin={data.profitLoss.margin}
      />

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sources de Revenus</h3>
        <div className="space-y-3">
          {data.revenue.bySource.map((source, index) => {
            const percentage = data.revenue.total > 0
              ? (source.amount / data.revenue.total) * 100
              : 0;
            return (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{source.source}</span>
                  <span className="text-sm text-gray-900 font-semibold">
                    ${source.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% du total</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
