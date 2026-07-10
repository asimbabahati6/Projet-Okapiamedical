import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Invoice } from '../../types/database';
import {
  BillingAnalyticsData,
  BillingAnalyticsFilters,
  PeriodType,
} from '../../types/billingAnalytics';
import {
  calculateBillingStatistics,
  calculatePaymentMethodStats,
  calculateCashFlow,
  calculateTopPayers,
  calculateInvoicesByStatus,
  calculateDailyRevenue,
  calculateOverdueBalances,
  calculatePeriodComparison,
} from '../../utils/billingCalculations';
import { forecastCashFlow } from '../../utils/billingForecasting';
import { checkAllAlerts } from '../../utils/billingAlerts';

function getPeriodDates(periodType: PeriodType, customStart?: Date, customEnd?: Date) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now);

  switch (periodType) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      break;
    case 'custom':
      startDate = customStart || new Date(now.getDate() - 30);
      endDate = customEnd || now;
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
  }

  return { startDate, endDate };
}

function getPreviousPeriodDates(startDate: Date, endDate: Date) {
  const duration = endDate.getTime() - startDate.getTime();
  const previousEnd = new Date(startDate.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);

  return { previousStart, previousEnd };
}

export function useBillingAnalytics(initialFilters?: Partial<BillingAnalyticsFilters>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [previousInvoices, setPreviousInvoices] = useState<Invoice[]>([]);
  const [filters, setFilters] = useState<BillingAnalyticsFilters>({
    period: initialFilters?.period || 'month',
    startDate: initialFilters?.startDate,
    endDate: initialFilters?.endDate,
    paymentMethods: initialFilters?.paymentMethods || [],
    departments: initialFilters?.departments || [],
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getPeriodDates(
        filters.period,
        filters.startDate,
        filters.endDate
      );

      let query = supabase
        .from('invoices')
        .select(`
          *,
          patient:patients(
            id,
            patient_number,
            first_name,
            last_name,
            phone,
            email
          )
        `)
        .neq('type_facture', 'conventionne')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (filters.paymentMethods && filters.paymentMethods.length > 0) {
        query = query.in('payment_method', filters.paymentMethods);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setInvoices((data as Invoice[]) || []);

      const { previousStart, previousEnd } = getPreviousPeriodDates(startDate, endDate);

      const { data: prevData } = await supabase
        .from('invoices')
        .select('*')
        .neq('type_facture', 'conventionne')
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString());

      setPreviousInvoices((prevData as Invoice[]) || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchInvoices();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchInvoices]);

  const analyticsData = useMemo<BillingAnalyticsData | null>(() => {
    if (loading) return null;

    const statistics = calculateBillingStatistics(invoices);
    const paymentMethods = calculatePaymentMethodStats(invoices);
    const cashFlow = calculateCashFlow(invoices);
    const { byAmount, byFrequency } = calculateTopPayers(invoices);
    const invoicesByStatus = calculateInvoicesByStatus(invoices);
    const dailyRevenue = calculateDailyRevenue(invoices);
    const overdueBalances = calculateOverdueBalances(invoices);
    const comparison = calculatePeriodComparison(invoices, previousInvoices);

    const forecast = forecastCashFlow(cashFlow, 14);

    return {
      statistics,
      paymentMethods,
      cashFlow,
      topPayersByAmount: byAmount,
      topPayersByFrequency: byFrequency,
      alerts: [],
      forecast,
      comparison,
      invoicesByStatus,
      dailyRevenue,
      overdueBalances,
    };
  }, [invoices, previousInvoices, loading]);

  useEffect(() => {
    const checkAlerts = async () => {
      if (analyticsData) {
        const alerts = await checkAllAlerts(analyticsData.statistics, invoices);
        if (alerts.length > 0 && analyticsData) {
          analyticsData.alerts = alerts;
        }
      }
    };

    checkAlerts();
  }, [analyticsData, invoices]);

  const updateFilters = useCallback((newFilters: Partial<BillingAnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refresh = useCallback(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    data: analyticsData,
    loading,
    error,
    filters,
    updateFilters,
    refresh,
    lastRefresh,
  };
}
