import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChartBar as BarChart3, RefreshCw, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { useBillingAnalytics } from '../../hooks/billing/useBillingAnalytics';
import { BillingKPICards } from '../../components/billing/analytics/BillingKPICards';
import { BillingSummaryTable } from '../../components/billing/analytics/BillingSummaryTable';
import { CollectionTrendChart } from '../../components/billing/analytics/CollectionTrendChart';
import { InvoiceStatusChart } from '../../components/billing/analytics/InvoiceStatusChart';
import { InsightsPanel } from '../../components/billing/analytics/InsightsPanel';
import { ForecastPanel } from '../../components/billing/analytics/ForecastPanel';
import { PaymentMethodBarChart } from '../../components/billing/charts/PaymentMethodBarChart';
import { TopPayersAnalysis } from '../../components/billing/analytics/TopPayersAnalysis';
import { BillingAlertPanel } from '../../components/billing/analytics/BillingAlertPanel';
import { ExportButtons } from '../../components/billing/analytics/ExportButtons';
import { PeriodType } from '../../types/billingAnalytics';
import { generateInsights } from '../../utils/billingInsights';
import { supabase } from '../../lib/supabase';
import { Invoice } from '../../types/database';
import { calculateBillingStatistics } from '../../utils/billingCalculations';

interface BillingAnalyticsPageProps {
  onNavigateToInvoices?: () => void;
}

export function BillingAnalyticsPage({ onNavigateToInvoices }: BillingAnalyticsPageProps = {}) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const {
    data: analyticsData,
    loading,
    error,
    filters,
    updateFilters,
    refresh,
    lastRefresh
  } = useBillingAnalytics({ period: selectedPeriod });

  const [dayData, setDayData] = useState<any>(null);
  const [weekData, setWeekData] = useState<any>(null);
  const [monthData, setMonthData] = useState<any>(null);
  const [loadingMultiPeriod, setLoadingMultiPeriod] = useState(true);
  const [multiPeriodError, setMultiPeriodError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const timeoutId = setTimeout(() => {
      if (mounted && loadingMultiPeriod) {
        console.warn('Multi-period data loading timeout - using fallback data');
        setDayData(calculateBillingStatistics([]));
        setWeekData(calculateBillingStatistics([]));
        setMonthData(calculateBillingStatistics([]));
        setLoadingMultiPeriod(false);
      }
    }, 10000);

    async function loadMultiPeriodData() {
      if (!mounted) return;

      setLoadingMultiPeriod(true);
      setMultiPeriodError(null);
      try {
        const now = new Date();

        const dayStart = new Date(now);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(now);
        dayEnd.setHours(23, 59, 59, 999);

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);

        const monthStart = new Date(now);
        monthStart.setDate(now.getDate() - 30);

        const [dayResult, weekResult, monthResult] = await Promise.all([
          supabase.from('invoices').select('*').gte('created_at', dayStart.toISOString()).lte('created_at', dayEnd.toISOString()),
          supabase.from('invoices').select('*').gte('created_at', weekStart.toISOString()).lte('created_at', now.toISOString()),
          supabase.from('invoices').select('*').gte('created_at', monthStart.toISOString()).lte('created_at', now.toISOString())
        ]);

        if (!mounted) return;

        setDayData(calculateBillingStatistics((dayResult.data as Invoice[]) || []));
        setWeekData(calculateBillingStatistics((weekResult.data as Invoice[]) || []));
        setMonthData(calculateBillingStatistics((monthResult.data as Invoice[]) || []));
      } catch (err) {
        console.error('Error loading multi-period data:', err);
        setMultiPeriodError(err instanceof Error ? err.message : 'Erreur de chargement');
        setDayData(calculateBillingStatistics([]));
        setWeekData(calculateBillingStatistics([]));
        setMonthData(calculateBillingStatistics([]));
      } finally {
        if (mounted) {
          clearTimeout(timeoutId);
          setLoadingMultiPeriod(false);
        }
      }
    }

    loadMultiPeriodData();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const insights = useMemo(() => {
    if (!analyticsData) return [];
    return generateInsights(
      analyticsData.statistics,
      analyticsData.comparison,
      analyticsData.forecast,
      analyticsData.cashFlow,
      []
    );
  }, [analyticsData]);

  function handlePeriodChange(period: PeriodType) {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      updateFilters({ period });
    }
  }

  function handleCustomPeriodApply() {
    if (!customStartDate || !customEndDate) return;
    updateFilters({
      period: 'custom',
      startDate: new Date(customStartDate),
      endDate: new Date(customEndDate)
    });
  }

  function getPeriodLabel(): string {
    switch (selectedPeriod) {
      case 'today':
        return 'Aujourd\'hui';
      case 'week':
        return 'Cette Semaine (7 derniers jours)';
      case 'month':
        return 'Ce Mois (30 derniers jours)';
      case 'custom':
        return customStartDate && customEndDate
          ? `${new Date(customStartDate).toLocaleDateString('fr-FR')} - ${new Date(customEndDate).toLocaleDateString('fr-FR')}`
          : 'Période Personnalisée';
      default:
        return 'Période';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement des analytics...</p>
          <p className="text-gray-500 text-sm mt-2">Analyse des données de facturation en cours</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-2xl mx-auto mt-20">
        <p className="text-red-800 font-medium mb-2">Erreur de chargement</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={refresh}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center max-w-2xl mx-auto mt-20">
        <p className="text-yellow-800 font-medium">Aucune donnée disponible</p>
        <p className="text-yellow-600 text-sm mt-2">Commencez par créer des factures pour voir les analytics</p>
      </div>
    );
  }

  const multiPeriodDataReady = dayData && weekData && monthData;

  return (
    <div className="space-y-6">
      {loadingMultiPeriod && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="text-blue-800 text-sm">Chargement des données comparatives...</p>
        </div>
      )}
      {multiPeriodError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">Certaines données comparatives n'ont pas pu être chargées. Les données principales sont affichées.</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Analytics de Facturation
          </h1>
          <p className="text-gray-600 mt-1">
            Analyse complète des performances financières
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onNavigateToInvoices && (
            <button
              onClick={onNavigateToInvoices}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              title="Retour aux factures"
            >
              <ArrowLeft className="w-4 h-4" />
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Factures</span>
            </button>
          )}
          <ExportButtons
            data={analyticsData}
            periodType={selectedPeriod}
            startDate={filters.startDate}
            endDate={filters.endDate}
            dayStats={dayData || undefined}
            weekStats={weekData || undefined}
            monthStats={monthData || undefined}
          />
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Actualiser les données"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Actualiser</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Période:</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handlePeriodChange('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => handlePeriodChange('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 Jours
            </button>
            <button
              onClick={() => handlePeriodChange('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 Jours
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-gray-500">→</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={handleCustomPeriodApply}
              disabled={!customStartDate || !customEndDate}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Appliquer
            </button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Période sélectionnée: <span className="font-medium text-gray-900">{getPeriodLabel()}</span>
          </span>
          <span className="text-gray-500">
            Dernière actualisation: {lastRefresh.toLocaleTimeString('fr-FR')}
          </span>
        </div>
      </div>

      {analyticsData.alerts.length > 0 && (
        <BillingAlertPanel alerts={analyticsData.alerts} />
      )}

      <BillingKPICards
        statistics={analyticsData.statistics}
        comparison={analyticsData.comparison}
      />

      {multiPeriodDataReady && (
        <BillingSummaryTable
          dayStats={dayData}
          weekStats={weekData}
          monthStats={monthData}
          onPeriodClick={handlePeriodChange}
        />
      )}

      <CollectionTrendChart data={analyticsData.cashFlow} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InvoiceStatusChart data={analyticsData.invoicesByStatus} />
        <PaymentMethodBarChart data={analyticsData.paymentMethods} />
      </div>

      <InsightsPanel insights={insights} />

      <ForecastPanel forecast={analyticsData.forecast} />

      {analyticsData.topPayersByAmount.length > 0 && (
        <TopPayersAnalysis
          byAmount={analyticsData.topPayersByAmount}
          byFrequency={analyticsData.topPayersByFrequency}
        />
      )}

      <div className="bg-gray-50 rounded-xl p-6 text-center text-sm text-gray-600">
        <p>
          Rapport généré pour la période {getPeriodLabel().toLowerCase()} •{' '}
          {analyticsData.statistics.invoicesCount.total} factures analysées •{' '}
          Dernière mise à jour: {lastRefresh.toLocaleString('fr-FR')}
        </p>
      </div>
    </div>
  );
}
