import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export type PeriodType = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface FinancialMetrics {
  revenue: {
    total: number;
    trend: number;
    byPeriod: { date: string; amount: number }[];
    bySource: { source: string; amount: number }[];
  };
  expenses: {
    total: number;
    trend: number;
    byCategory: { category: string; amount: number; percentage: number }[];
    byPeriod: { date: string; amount: number }[];
  };
  profitLoss: {
    net: number;
    gross: number;
    margin: number;
    trend: number;
  };
  cashFlow: {
    incoming: number;
    outgoing: number;
    balance: number;
  };
}

interface UseFinancialAnalyticsOptions {
  period?: PeriodType;
  startDate?: Date;
  endDate?: Date;
  autoRefresh?: boolean;
}

interface UseFinancialAnalyticsResult {
  data: FinancialMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function getPeriodDates(period: PeriodType, startDate?: Date, endDate?: Date): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let start: Date;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      break;
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;
    case 'quarter':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      break;
    case 'custom':
      if (!startDate || !endDate) {
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        return { start: startDate, end: endDate };
      }
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { start, end };
}

function getPreviousPeriodDates(start: Date, end: Date): { start: Date; end: Date } {
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return { start: prevStart, end: prevEnd };
}

export function useFinancialAnalytics(
  options: UseFinancialAnalyticsOptions = {}
): UseFinancialAnalyticsResult {
  const { period = 'month', startDate, endDate, autoRefresh = false } = options;

  const [data, setData] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = getPeriodDates(period, startDate, endDate);
      const { start: prevStart, end: prevEnd } = getPreviousPeriodDates(start, end);

      const [invoicesResult, expensesResult, prevInvoicesResult, prevExpensesResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        supabase
          .from('expenses')
          .select('*')
          .gte('expense_date', start.toISOString())
          .lte('expense_date', end.toISOString()),
        supabase
          .from('invoices')
          .select('*')
          .gte('created_at', prevStart.toISOString())
          .lte('created_at', prevEnd.toISOString()),
        supabase
          .from('expenses')
          .select('*')
          .gte('expense_date', prevStart.toISOString())
          .lte('expense_date', prevEnd.toISOString()),
      ]);

      if (invoicesResult.error) throw invoicesResult.error;
      if (expensesResult.error) throw expensesResult.error;

      const invoices = invoicesResult.data || [];
      const expenses = expensesResult.data || [];
      const prevInvoices = prevInvoicesResult.data || [];
      const prevExpenses = prevExpensesResult.data || [];

      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const prevTotalRevenue = prevInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const revenueTrend = prevTotalRevenue > 0
        ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
        : totalRevenue > 0 ? 100 : 0;

      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const prevTotalExpenses = prevExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const expensesTrend = prevTotalExpenses > 0
        ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100
        : totalExpenses > 0 ? 100 : 0;

      const revenueBySource = invoices.reduce((acc, inv) => {
        const source = inv.patient_type || 'Direct';
        acc[source] = (acc[source] || 0) + (inv.total_amount || 0);
        return acc;
      }, {} as Record<string, number>);

      const expensesByCategory = expenses.reduce((acc, exp) => {
        const category = exp.category || 'Autres';
        acc[category] = (acc[category] || 0) + (exp.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      const expensesByCategoryArray = Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }));

      const revenueByPeriodMap = new Map<string, number>();
      invoices.forEach((inv) => {
        const date = new Date(inv.created_at).toISOString().split('T')[0];
        revenueByPeriodMap.set(date, (revenueByPeriodMap.get(date) || 0) + (inv.total_amount || 0));
      });

      const expensesByPeriodMap = new Map<string, number>();
      expenses.forEach((exp) => {
        const date = new Date(exp.expense_date).toISOString().split('T')[0];
        expensesByPeriodMap.set(date, (expensesByPeriodMap.get(date) || 0) + (exp.amount || 0));
      });

      const netProfit = totalRevenue - totalExpenses;
      const prevNetProfit = prevTotalRevenue - prevTotalExpenses;
      const profitTrend = prevNetProfit !== 0
        ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100
        : netProfit > 0 ? 100 : netProfit < 0 ? -100 : 0;

      const metrics: FinancialMetrics = {
        revenue: {
          total: totalRevenue,
          trend: revenueTrend,
          byPeriod: Array.from(revenueByPeriodMap.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date)),
          bySource: Object.entries(revenueBySource).map(([source, amount]) => ({ source, amount })),
        },
        expenses: {
          total: totalExpenses,
          trend: expensesTrend,
          byCategory: expensesByCategoryArray,
          byPeriod: Array.from(expensesByPeriodMap.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date)),
        },
        profitLoss: {
          net: netProfit,
          gross: totalRevenue,
          margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
          trend: profitTrend,
        },
        cashFlow: {
          incoming: totalRevenue,
          outgoing: totalExpenses,
          balance: netProfit,
        },
      };

      setData(metrics);
    } catch (err) {
      console.error('Error fetching financial analytics:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données financières');
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchFinancialData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchFinancialData]);

  return {
    data,
    loading,
    error,
    refresh: fetchFinancialData,
  };
}
