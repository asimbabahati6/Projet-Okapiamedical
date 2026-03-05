export interface BillingPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

export type PeriodType = 'today' | 'week' | 'month' | 'custom';

export interface BillingStatistics {
  totalInvoiced: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  totalCancelled: number;
  invoicesCount: {
    total: number;
    paid: number;
    pending: number;
    partial: number;
    cancelled: number;
  };
  recoveryRate: number;
  averagePaymentAmount: number;
  averagePaymentDelay: number;
}

export interface PaymentMethodStats {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface CashFlowDataPoint {
  date: Date;
  collected: number;
  pending: number;
  netFlow: number;
}

export interface TopPayer {
  patientId: string;
  patientName: string;
  patientNumber: string;
  totalAmount: number;
  paymentCount: number;
  averagePayment: number;
  lastPaymentDate: string | null;
  status: 'active' | 'inactive';
}

export interface BillingAlert {
  id: string;
  type: 'recovery_rate' | 'overdue_invoices' | 'negative_flow' | 'critical_balance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  value: number;
  threshold: number;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface AlertThresholds {
  minRecoveryRate: number;
  maxOverdueAmount: number;
  maxOverdueDays: number;
  criticalBalanceThreshold: number;
  alertRecipients: string[];
}

export interface ForecastDataPoint {
  date: Date;
  optimistic: number;
  realistic: number;
  pessimistic: number;
  confidence: number;
}

export interface ForecastResult {
  period: string;
  forecasts: ForecastDataPoint[];
  historicalData: CashFlowDataPoint[];
  accuracy: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  seasonalPattern: boolean;
}

export interface PeriodComparison {
  current: BillingStatistics;
  previous: BillingStatistics;
  change: {
    totalInvoiced: number;
    totalCollected: number;
    recoveryRate: number;
    averagePayment: number;
  };
  changePercentage: {
    totalInvoiced: number;
    totalCollected: number;
    recoveryRate: number;
    averagePayment: number;
  };
}

export interface InvoicesByStatus {
  status: 'pending' | 'partial' | 'paid' | 'cancelled';
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  invoicesCount: number;
  averageInvoice: number;
}

export interface PatientBalance {
  patientId: string;
  patientName: string;
  patientNumber: string;
  totalOwed: number;
  oldestInvoiceDate: string;
  daysPastDue: number;
  invoicesCount: number;
}

export interface BillingAnalyticsData {
  statistics: BillingStatistics;
  paymentMethods: PaymentMethodStats[];
  cashFlow: CashFlowDataPoint[];
  topPayersByAmount: TopPayer[];
  topPayersByFrequency: TopPayer[];
  alerts: BillingAlert[];
  forecast: ForecastResult;
  comparison: PeriodComparison;
  invoicesByStatus: InvoicesByStatus[];
  dailyRevenue: DailyRevenue[];
  overdueBalances: PatientBalance[];
}

export interface BillingAnalyticsFilters {
  period: PeriodType;
  startDate?: Date;
  endDate?: Date;
  paymentMethods?: string[];
  departments?: string[];
}
