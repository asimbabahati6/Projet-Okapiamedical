import { Invoice } from '../types/database';

export type PeriodFilter = 'today' | 'week' | 'month' | 'all' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export function filterInvoicesByPeriod(
  invoices: Invoice[],
  period: PeriodFilter,
  customRange?: DateRange
): Invoice[] {
  const now = new Date();

  return invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.created_at);

    switch (period) {
      case 'today': {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return invoiceDate >= today && invoiceDate < tomorrow;
      }

      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return invoiceDate >= weekAgo && invoiceDate <= now;
      }

      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setDate(now.getDate() - 30);
        return invoiceDate >= monthAgo && invoiceDate <= now;
      }

      case 'custom': {
        if (!customRange) return true;
        return invoiceDate >= customRange.start && invoiceDate <= customRange.end;
      }

      case 'all':
      default:
        return true;
    }
  });
}

export function calculatePeriodStats(invoices: Invoice[]) {
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.balance, 0);
  const totalBalance = invoices.reduce((sum, inv) => sum + inv.balance, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').length;

  return {
    count: invoices.length,
    totalInvoiced,
    totalCollected,
    totalPending,
    totalBalance,
    totalPaid,
    averageInvoice: invoices.length > 0 ? totalInvoiced / invoices.length : 0,
    recoveryRate: totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0,
  };
}

export function comparePeriods(current: Invoice[], previous: Invoice[]) {
  const currentStats = calculatePeriodStats(current);
  const previousStats = calculatePeriodStats(previous);

  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    current: currentStats,
    previous: previousStats,
    changes: {
      count: calculateChange(currentStats.count, previousStats.count),
      totalInvoiced: calculateChange(currentStats.totalInvoiced, previousStats.totalInvoiced),
      totalCollected: calculateChange(currentStats.totalCollected, previousStats.totalCollected),
      totalBalance: calculateChange(currentStats.totalBalance, previousStats.totalBalance),
      recoveryRate: currentStats.recoveryRate - previousStats.recoveryRate,
    }
  };
}

export function getPeriodLabel(period: PeriodFilter, customRange?: DateRange): string {
  switch (period) {
    case 'today':
      return "Aujourd'hui";
    case 'week':
      return 'Cette Semaine (7j)';
    case 'month':
      return 'Ce Mois (30j)';
    case 'custom':
      if (!customRange) return 'Personnalisé';
      return `${customRange.start.toLocaleDateString('fr-FR')} - ${customRange.end.toLocaleDateString('fr-FR')}`;
    case 'all':
    default:
      return 'Toutes les périodes';
  }
}

export function getPreviousPeriodRange(period: PeriodFilter): DateRange {
  const now = new Date();

  switch (period) {
    case 'today': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const endYesterday = new Date(yesterday);
      endYesterday.setHours(23, 59, 59, 999);
      return { start: yesterday, end: endYesterday };
    }

    case 'week': {
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(now.getDate() - 14);
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      return { start: twoWeeksAgo, end: oneWeekAgo };
    }

    case 'month': {
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setDate(now.getDate() - 60);
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setDate(now.getDate() - 30);
      return { start: twoMonthsAgo, end: oneMonthAgo };
    }

    default:
      return { start: now, end: now };
  }
}

export function getLast7DaysData(invoices: Invoice[]): { date: string; amount: number }[] {
  const now = new Date();
  const data: { date: string; amount: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.payment_date || inv.created_at);
      return invDate.toISOString().split('T')[0] === dateStr;
    });

    const amount = dayInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0);

    data.push({
      date: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      amount
    });
  }

  return data;
}
