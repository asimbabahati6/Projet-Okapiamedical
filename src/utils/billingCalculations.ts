import { Invoice, PaymentHistory } from '../types/database';
import {
  BillingStatistics,
  PaymentMethodStats,
  CashFlowDataPoint,
  TopPayer,
  InvoicesByStatus,
  DailyRevenue,
  PatientBalance,
  PeriodComparison
} from '../types/billingAnalytics';

export function calculateBillingStatistics(invoices: Invoice[]): BillingStatistics {
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const totalPending = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.balance, 0);

  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return false;
    const created = new Date(inv.created_at);
    const daysPast = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysPast > 30;
  });

  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.balance, 0);

  const totalCancelled = invoices
    .filter(inv => inv.status === 'cancelled')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const recoveryRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

  const paidInvoices = invoices.filter(inv => inv.paid_amount > 0);
  const averagePaymentAmount = paidInvoices.length > 0
    ? paidInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0) / paidInvoices.length
    : 0;

  const invoicesWithPaymentDate = invoices.filter(inv => inv.payment_date);
  const averagePaymentDelay = invoicesWithPaymentDate.length > 0
    ? invoicesWithPaymentDate.reduce((sum, inv) => {
        const created = new Date(inv.created_at);
        const paid = new Date(inv.payment_date!);
        return sum + (paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / invoicesWithPaymentDate.length
    : 0;

  return {
    totalInvoiced,
    totalCollected,
    totalPending,
    totalOverdue,
    totalCancelled,
    invoicesCount: {
      total: invoices.length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      pending: invoices.filter(inv => inv.status === 'pending').length,
      partial: invoices.filter(inv => inv.status === 'partial').length,
      cancelled: invoices.filter(inv => inv.status === 'cancelled').length,
    },
    recoveryRate,
    averagePaymentAmount,
    averagePaymentDelay,
  };
}

export function calculatePaymentMethodStats(invoices: Invoice[]): PaymentMethodStats[] {
  const methodMap = new Map<string, { amount: number; count: number }>();

  invoices
    .filter(inv => inv.payment_method && inv.paid_amount > 0)
    .forEach(inv => {
      const method = inv.payment_method!;
      const current = methodMap.get(method) || { amount: 0, count: 0 };
      methodMap.set(method, {
        amount: current.amount + inv.paid_amount,
        count: current.count + 1,
      });
    });

  const total = Array.from(methodMap.values()).reduce((sum, m) => sum + m.amount, 0);

  return Array.from(methodMap.entries()).map(([method, data]) => ({
    method,
    amount: data.amount,
    count: data.count,
    percentage: total > 0 ? (data.amount / total) * 100 : 0,
  })).sort((a, b) => b.amount - a.amount);
}

export function calculateCashFlow(invoices: Invoice[]): CashFlowDataPoint[] {
  const flowMap = new Map<string, { collected: number; pending: number }>();

  invoices.forEach(inv => {
    if (inv.paid_amount > 0 && inv.payment_date) {
      const date = new Date(inv.payment_date).toISOString().split('T')[0];
      const current = flowMap.get(date) || { collected: 0, pending: 0 };
      flowMap.set(date, {
        ...current,
        collected: current.collected + inv.paid_amount,
      });
    }

    if (inv.balance > 0) {
      const date = new Date(inv.created_at).toISOString().split('T')[0];
      const current = flowMap.get(date) || { collected: 0, pending: 0 };
      flowMap.set(date, {
        ...current,
        pending: current.pending + inv.balance,
      });
    }
  });

  return Array.from(flowMap.entries())
    .map(([dateStr, data]) => ({
      date: new Date(dateStr),
      collected: data.collected,
      pending: data.pending,
      netFlow: data.collected - data.pending,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function calculateTopPayers(invoices: Invoice[]): { byAmount: TopPayer[]; byFrequency: TopPayer[] } {
  const payerMap = new Map<string, {
    patientId: string;
    patientName: string;
    patientNumber: string;
    totalAmount: number;
    paymentCount: number;
    lastPaymentDate: string | null;
  }>();

  invoices
    .filter(inv => inv.patient && inv.paid_amount > 0)
    .forEach(inv => {
      const key = inv.patient_id;
      const current = payerMap.get(key) || {
        patientId: inv.patient_id,
        patientName: `${inv.patient!.first_name} ${inv.patient!.last_name}`,
        patientNumber: inv.patient!.patient_number,
        totalAmount: 0,
        paymentCount: 0,
        lastPaymentDate: null,
      };

      payerMap.set(key, {
        ...current,
        totalAmount: current.totalAmount + inv.paid_amount,
        paymentCount: current.paymentCount + 1,
        lastPaymentDate: inv.payment_date || current.lastPaymentDate,
      });
    });

  const payers = Array.from(payerMap.values()).map(p => ({
    ...p,
    averagePayment: p.totalAmount / p.paymentCount,
    status: (p.lastPaymentDate &&
      (Date.now() - new Date(p.lastPaymentDate).getTime()) < 90 * 24 * 60 * 60 * 1000)
      ? 'active' as const
      : 'inactive' as const,
  }));

  return {
    byAmount: [...payers].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10),
    byFrequency: [...payers].sort((a, b) => b.paymentCount - a.paymentCount).slice(0, 10),
  };
}

export function calculateInvoicesByStatus(invoices: Invoice[]): InvoicesByStatus[] {
  const statusMap = new Map<string, { count: number; totalAmount: number }>();

  invoices.forEach(inv => {
    const current = statusMap.get(inv.status) || { count: 0, totalAmount: 0 };
    statusMap.set(inv.status, {
      count: current.count + 1,
      totalAmount: current.totalAmount + inv.total_amount,
    });
  });

  const total = invoices.length;

  return Array.from(statusMap.entries()).map(([status, data]) => ({
    status: status as 'pending' | 'partial' | 'paid' | 'cancelled',
    count: data.count,
    totalAmount: data.totalAmount,
    percentage: total > 0 ? (data.count / total) * 100 : 0,
  }));
}

export function calculateDailyRevenue(invoices: Invoice[]): DailyRevenue[] {
  const revenueMap = new Map<string, { revenue: number; count: number }>();

  invoices
    .filter(inv => inv.paid_amount > 0 && inv.payment_date)
    .forEach(inv => {
      const date = new Date(inv.payment_date!).toISOString().split('T')[0];
      const current = revenueMap.get(date) || { revenue: 0, count: 0 };
      revenueMap.set(date, {
        revenue: current.revenue + inv.paid_amount,
        count: current.count + 1,
      });
    });

  return Array.from(revenueMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      invoicesCount: data.count,
      averageInvoice: data.revenue / data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateOverdueBalances(invoices: Invoice[]): PatientBalance[] {
  const balanceMap = new Map<string, {
    patientId: string;
    patientName: string;
    patientNumber: string;
    totalOwed: number;
    oldestInvoiceDate: string;
    invoicesCount: number;
  }>();

  invoices
    .filter(inv => inv.balance > 0 && inv.patient)
    .forEach(inv => {
      const key = inv.patient_id;
      const current = balanceMap.get(key);

      if (!current) {
        balanceMap.set(key, {
          patientId: inv.patient_id,
          patientName: `${inv.patient!.first_name} ${inv.patient!.last_name}`,
          patientNumber: inv.patient!.patient_number,
          totalOwed: inv.balance,
          oldestInvoiceDate: inv.created_at,
          invoicesCount: 1,
        });
      } else {
        balanceMap.set(key, {
          ...current,
          totalOwed: current.totalOwed + inv.balance,
          oldestInvoiceDate: inv.created_at < current.oldestInvoiceDate ? inv.created_at : current.oldestInvoiceDate,
          invoicesCount: current.invoicesCount + 1,
        });
      }
    });

  return Array.from(balanceMap.values())
    .map(b => ({
      ...b,
      daysPastDue: Math.floor((Date.now() - new Date(b.oldestInvoiceDate).getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .sort((a, b) => b.totalOwed - a.totalOwed);
}

export function calculatePeriodComparison(
  currentInvoices: Invoice[],
  previousInvoices: Invoice[]
): PeriodComparison {
  const current = calculateBillingStatistics(currentInvoices);
  const previous = calculateBillingStatistics(previousInvoices);

  const calcChange = (curr: number, prev: number) => curr - prev;
  const calcPercentage = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : 0;

  return {
    current,
    previous,
    change: {
      totalInvoiced: calcChange(current.totalInvoiced, previous.totalInvoiced),
      totalCollected: calcChange(current.totalCollected, previous.totalCollected),
      recoveryRate: calcChange(current.recoveryRate, previous.recoveryRate),
      averagePayment: calcChange(current.averagePaymentAmount, previous.averagePaymentAmount),
    },
    changePercentage: {
      totalInvoiced: calcPercentage(current.totalInvoiced, previous.totalInvoiced),
      totalCollected: calcPercentage(current.totalCollected, previous.totalCollected),
      recoveryRate: calcPercentage(current.recoveryRate, previous.recoveryRate),
      averagePayment: calcPercentage(current.averagePaymentAmount, previous.averagePaymentAmount),
    },
  };
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}
