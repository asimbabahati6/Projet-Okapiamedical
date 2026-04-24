export type ReportPeriodType = 'monthly' | 'quarterly' | 'annual' | 'custom';
export type ReportTemplateType = 'standard' | 'executive' | 'detailed' | 'monthly' | 'annual';
export type ReportLanguage = 'fr' | 'en';

export interface ReportPeriod {
  type: ReportPeriodType;
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface ReportConfiguration {
  period: ReportPeriod;
  template: ReportTemplateType;
  language: ReportLanguage;
  includeCharts: boolean;
  includeComparison: boolean;
  includeRecommendations: boolean;
  includeExecutiveSummary: boolean;
  detailLevel: 'summary' | 'standard' | 'detailed';
}

export interface BalanceSheet {
  assets: {
    current: {
      cash: number;
      accountsReceivable: number;
      inventory: number;
      other: number;
      total: number;
    };
    nonCurrent: {
      equipment: number;
      property: number;
      investments: number;
      other: number;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      accountsPayable: number;
      shortTermDebt: number;
      accruedExpenses: number;
      other: number;
      total: number;
    };
    nonCurrent: {
      longTermDebt: number;
      deferredRevenue: number;
      other: number;
      total: number;
    };
    total: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    currentPeriodProfit: number;
    total: number;
  };
}

export interface IncomeStatement {
  revenue: {
    consultations: number;
    procedures: number;
    pharmacy: number;
    laboratory: number;
    other: number;
    total: number;
  };
  costOfRevenue: {
    medicalSupplies: number;
    pharmacyInventory: number;
    laboratorySupplies: number;
    total: number;
  };
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: {
    salaries: number;
    rent: number;
    utilities: number;
    maintenance: number;
    insurance: number;
    marketing: number;
    administrative: number;
    depreciation: number;
    other: number;
    total: number;
  };
  operatingIncome: number;
  operatingMargin: number;
  otherIncome: number;
  otherExpenses: number;
  netIncome: number;
  netMargin: number;
}

export interface CashFlowStatement {
  operatingActivities: {
    netIncome: number;
    depreciation: number;
    accountsReceivableChange: number;
    inventoryChange: number;
    accountsPayableChange: number;
    other: number;
    total: number;
  };
  investingActivities: {
    equipmentPurchases: number;
    equipmentSales: number;
    investments: number;
    other: number;
    total: number;
  };
  financingActivities: {
    debtIssuance: number;
    debtRepayment: number;
    equityIssuance: number;
    dividends: number;
    other: number;
    total: number;
  };
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

export interface FinancialRatios {
  liquidity: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
    workingCapital: number;
  };
  profitability: {
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    returnOnAssets: number;
    returnOnEquity: number;
    revenuePerPatient: number;
  };
  efficiency: {
    assetTurnover: number;
    receivablesTurnover: number;
    daysRevenueOutstanding: number;
    inventoryTurnover: number;
    daysInventoryOutstanding: number;
  };
  leverage: {
    debtToAssets: number;
    debtToEquity: number;
    equityMultiplier: number;
    interestCoverage: number;
  };
}

export interface TrendAnalysis {
  revenue: {
    trend: 'increasing' | 'stable' | 'decreasing';
    growthRate: number;
    volatility: number;
    seasonality: boolean;
  };
  expenses: {
    trend: 'increasing' | 'stable' | 'decreasing';
    growthRate: number;
    volatility: number;
  };
  profitability: {
    trend: 'improving' | 'stable' | 'declining';
    changeRate: number;
  };
  cashFlow: {
    trend: 'positive' | 'stable' | 'negative';
    averageMonthly: number;
  };
}

export interface FinancialAlert {
  id: string;
  type: 'liquidity' | 'profitability' | 'efficiency' | 'leverage' | 'trend';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  value: number;
  threshold: number;
  recommendation: string;
}

export interface FinancialRecommendation {
  id: string;
  category: 'revenue' | 'cost_reduction' | 'cash_flow' | 'investment' | 'risk_management';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  expectedImpact: string;
  implementation: string;
  timeframe: string;
}

export interface PeriodComparison {
  current: {
    revenue: number;
    expenses: number;
    netIncome: number;
    cashFlow: number;
  };
  previous: {
    revenue: number;
    expenses: number;
    netIncome: number;
    cashFlow: number;
  };
  change: {
    revenue: number;
    expenses: number;
    netIncome: number;
    cashFlow: number;
  };
  changePercentage: {
    revenue: number;
    expenses: number;
    netIncome: number;
    cashFlow: number;
  };
}

export interface FinancialHealthScore {
  overall: number;
  liquidity: number;
  profitability: number;
  efficiency: number;
  leverage: number;
  trend: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
    backgroundColor?: string;
  }[];
}

export interface FinancialReportData {
  reportInfo: {
    reportNumber: string;
    generatedDate: Date;
    generatedBy: string;
    period: ReportPeriod;
    configuration: ReportConfiguration;
  };
  executiveSummary: {
    keyHighlights: string[];
    majorConcerns: string[];
    topRecommendations: string[];
    financialHealth: FinancialHealthScore;
  };
  balanceSheet: BalanceSheet;
  incomeStatement: IncomeStatement;
  cashFlowStatement: CashFlowStatement;
  ratios: FinancialRatios;
  trendAnalysis: TrendAnalysis;
  comparison: PeriodComparison;
  alerts: FinancialAlert[];
  recommendations: FinancialRecommendation[];
  charts: {
    revenueEvolution: ChartData;
    expenseBreakdown: ChartData;
    cashFlowTrend: ChartData;
    profitabilityTrend: ChartData;
    revenueByService: ChartData;
  };
}

export interface SavedFinancialReport {
  id: string;
  reportNumber: string;
  periodType: ReportPeriodType;
  startDate: string;
  endDate: string;
  fileUrl: string | null;
  fileSize: number | null;
  generatedBy: string;
  generatedAt: string;
  metadata: {
    template: ReportTemplateType;
    language: ReportLanguage;
    pageCount: number;
    includesCharts: boolean;
  };
  // snake_case aliases for DB-mapped usage
  report_number?: string;
  period_type?: ReportPeriodType;
  start_date?: string;
  end_date?: string;
  file_url?: string | null;
  file_size?: number | null;
  generated_at?: string;
}
