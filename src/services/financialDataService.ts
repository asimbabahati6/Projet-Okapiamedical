import { supabase } from '../lib/supabase';
import { ReportPeriod } from '../types/financialReport';
import { Invoice, PaymentHistory } from '../types/database';

interface RawFinancialData {
  invoices: Invoice[];
  payments: PaymentHistory[];
  expenses: ExpenseData;
  consultations: ConsultationStats;
  patients: PatientStats;
}

interface ExpenseData {
  salaries: number;
  supplies: number;
  utilities: number;
  rent: number;
  maintenance: number;
  insurance: number;
  marketing: number;
  administrative: number;
  other: number;
}

interface ConsultationStats {
  total: number;
  byService: { [key: string]: number };
  averageFee: number;
}

interface PatientStats {
  total: number;
  new: number;
  returning: number;
  averageVisits: number;
}

export async function fetchFinancialData(period: ReportPeriod): Promise<RawFinancialData> {
  const startDate = period.startDate.toISOString();
  const endDate = period.endDate.toISOString();

  const [invoices, payments, expenses, consultations, patients] = await Promise.all([
    fetchInvoices(startDate, endDate),
    fetchPayments(startDate, endDate),
    fetchExpenses(startDate, endDate),
    fetchConsultationStats(startDate, endDate),
    fetchPatientStats(startDate, endDate)
  ]);

  return {
    invoices,
    payments,
    expenses,
    consultations,
    patients
  };
}

async function fetchInvoices(startDate: string, endDate: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      patient:patients(*)
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  return data || [];
}

async function fetchPayments(startDate: string, endDate: string): Promise<PaymentHistory[]> {
  const { data, error } = await supabase
    .from('payment_history')
    .select('*')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)
    .order('payment_date', { ascending: true });

  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }

  return data || [];
}

async function fetchExpenses(startDate: string, endDate: string): Promise<ExpenseData> {
  // Fetch from expenses table
  const { data: expenseRecords, error } = await supabase
    .from('expenses')
    .select('category, amount')
    .gte('expense_date', startDate.split('T')[0])
    .lte('expense_date', endDate.split('T')[0]);

  if (error) {
    console.error('Error fetching expenses:', error);
  }

  // Initialize with supplies from stock movements
  const suppliesFromStock = await fetchSuppliesExpenses(startDate, endDate);

  const expenses: ExpenseData = {
    salaries: 0,
    supplies: suppliesFromStock,
    utilities: 0,
    rent: 0,
    maintenance: 0,
    insurance: 0,
    marketing: 0,
    administrative: 0,
    other: 0
  };

  // Sum up expenses by category
  if (expenseRecords) {
    expenseRecords.forEach(record => {
      switch (record.category) {
        case 'salaries':
          expenses.salaries += record.amount;
          break;
        case 'supplies':
          expenses.supplies += record.amount;
          break;
        case 'utilities':
          expenses.utilities += record.amount;
          break;
        case 'rent':
          expenses.rent += record.amount;
          break;
        case 'maintenance':
          expenses.maintenance += record.amount;
          break;
        case 'insurance':
          expenses.insurance += record.amount;
          break;
        case 'marketing':
          expenses.marketing += record.amount;
          break;
        case 'equipment':
        case 'transportation':
        case 'other':
          expenses.other += record.amount;
          break;
      }
    });
  }

  return expenses;
}

async function fetchSalaryExpenses(startDate: string, endDate: string): Promise<number> {
  return 0;
}

async function fetchSuppliesExpenses(startDate: string, endDate: string): Promise<number> {
  const { data: movements, error } = await supabase
    .from('stock_movements')
    .select('unit_price, quantity')
    .eq('movement_type', 'out')
    .gte('movement_date', startDate)
    .lte('movement_date', endDate);

  if (error || !movements) {
    console.error('Error fetching supplies expenses:', error);
    return 0;
  }

  return movements.reduce((sum, m) => sum + ((m.unit_price || 0) * m.quantity), 0);
}

async function fetchConsultationStats(startDate: string, endDate: string): Promise<ConsultationStats> {
  const { data, error } = await supabase
    .from('consultations')
    .select('id, service_id, consultation_fee')
    .gte('consultation_date', startDate)
    .lte('consultation_date', endDate);

  if (error || !data) {
    console.error('Error fetching consultation stats:', error);
    return {
      total: 0,
      byService: {},
      averageFee: 0
    };
  }

  const byService: { [key: string]: number } = {};
  let totalFee = 0;

  data.forEach(consultation => {
    const serviceId = consultation.service_id || 'unknown';
    byService[serviceId] = (byService[serviceId] || 0) + 1;
    totalFee += consultation.consultation_fee || 0;
  });

  return {
    total: data.length,
    byService,
    averageFee: data.length > 0 ? totalFee / data.length : 0
  };
}

async function fetchPatientStats(startDate: string, endDate: string): Promise<PatientStats> {
  const { data: allPatients, error: allError } = await supabase
    .from('patients')
    .select('id, created_at')
    .lte('created_at', endDate);

  const { data: newPatients, error: newError } = await supabase
    .from('patients')
    .select('id')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (allError || newError || !allPatients || !newPatients) {
    console.error('Error fetching patient stats');
    return {
      total: 0,
      new: 0,
      returning: 0,
      averageVisits: 0
    };
  }

  return {
    total: allPatients.length,
    new: newPatients.length,
    returning: allPatients.length - newPatients.length,
    averageVisits: 0
  };
}

export async function fetchComparativePeriod(period: ReportPeriod): Promise<RawFinancialData> {
  const periodLength = period.endDate.getTime() - period.startDate.getTime();
  const comparativeStartDate = new Date(period.startDate.getTime() - periodLength);
  const comparativeEndDate = new Date(period.startDate.getTime() - 1);

  const comparativePeriod: ReportPeriod = {
    type: period.type,
    startDate: comparativeStartDate,
    endDate: comparativeEndDate,
    label: `Période précédente`
  };

  return fetchFinancialData(comparativePeriod);
}

export function aggregateRevenueData(invoices: Invoice[]): {
  total: number;
  byStatus: { [key: string]: number };
  byMonth: { [key: string]: number };
  byService: { [key: string]: number };
} {
  const byStatus: { [key: string]: number } = {
    paid: 0,
    pending: 0,
    partial: 0,
    cancelled: 0
  };
  const byMonth: { [key: string]: number } = {};
  const byService: { [key: string]: number } = {};

  let total = 0;

  invoices.forEach(invoice => {
    total += invoice.total_amount;
    byStatus[invoice.status] = (byStatus[invoice.status] || 0) + invoice.total_amount;

    const month = new Date(invoice.created_at).toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + invoice.total_amount;

    const service = 'general';
    byService[service] = (byService[service] || 0) + invoice.total_amount;
  });

  return { total, byStatus, byMonth, byService };
}

export function aggregatePaymentData(payments: PaymentHistory[]): {
  total: number;
  byMethod: { [key: string]: number };
  byMonth: { [key: string]: number };
  count: number;
} {
  const byMethod: { [key: string]: number } = {};
  const byMonth: { [key: string]: number } = {};

  let total = 0;

  payments.forEach(payment => {
    total += payment.payment_amount;

    const method = payment.payment_method || 'unknown';
    byMethod[method] = (byMethod[method] || 0) + payment.payment_amount;

    const month = new Date(payment.payment_date).toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + payment.payment_amount;
  });

  return { total, byMethod, byMonth, count: payments.length };
}

export function calculateAveragePaymentDelay(invoices: Invoice[]): number {
  const paidInvoices = invoices.filter(inv =>
    inv.status === 'paid' && inv.payment_date
  );

  if (paidInvoices.length === 0) return 0;

  const totalDelay = paidInvoices.reduce((sum, inv) => {
    const createdDate = new Date(inv.created_at);
    const paidDate = new Date(inv.payment_date!);
    const delayDays = Math.floor((paidDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + delayDays;
  }, 0);

  return Math.round(totalDelay / paidInvoices.length);
}
