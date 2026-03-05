import {
  ReportPeriod,
  ReportConfiguration,
  FinancialReportData,
  ChartData
} from '../types/financialReport';
import {
  fetchFinancialData,
  fetchComparativePeriod,
  aggregateRevenueData,
  aggregatePaymentData
} from './financialDataService';
import {
  calculateBalanceSheet,
  calculateIncomeStatement,
  calculateCashFlowStatement,
  calculateFinancialRatios,
  calculatePeriodComparison
} from './financialCalculations';
import {
  analyzeTrends,
  generateFinancialAlerts,
  generateRecommendations,
  calculateFinancialHealthScore
} from './financialAnalysis';
import { generateFinancialReportPDF } from './pdfReportGenerator';

export async function generateCompleteFinancialReport(
  configuration: ReportConfiguration
): Promise<{ reportData: FinancialReportData; pdfBlob: Blob }> {
  const reportNumber = generateReportNumber();

  const rawData = await fetchFinancialData(configuration.period);

  const revenueAgg = aggregateRevenueData(rawData.invoices);
  const paymentAgg = aggregatePaymentData(rawData.payments);

  const calculationInput = {
    invoices: rawData.invoices,
    payments: rawData.payments,
    salaryExpenses: rawData.expenses.salaries,
    suppliesExpenses: rawData.expenses.supplies,
    otherExpenses: {
      rent: rawData.expenses.rent,
      utilities: rawData.expenses.utilities,
      maintenance: rawData.expenses.maintenance,
      insurance: rawData.expenses.insurance,
      marketing: rawData.expenses.marketing,
      administrative: rawData.expenses.administrative
    }
  };

  const balanceSheet = calculateBalanceSheet(calculationInput);
  const incomeStatement = calculateIncomeStatement(calculationInput);
  const cashFlowStatement = calculateCashFlowStatement(incomeStatement, balanceSheet);
  const ratios = calculateFinancialRatios(balanceSheet, incomeStatement, rawData.patients.total);

  let comparison;
  let trendAnalysis;

  if (configuration.includeComparison) {
    const previousData = await fetchComparativePeriod(configuration.period);
    const previousInput = {
      invoices: previousData.invoices,
      payments: previousData.payments,
      salaryExpenses: previousData.expenses.salaries,
      suppliesExpenses: previousData.expenses.supplies,
      otherExpenses: {
        rent: previousData.expenses.rent,
        utilities: previousData.expenses.utilities,
        maintenance: previousData.expenses.maintenance,
        insurance: previousData.expenses.insurance,
        marketing: previousData.expenses.marketing,
        administrative: previousData.expenses.administrative
      }
    };

    const previousBalance = calculateBalanceSheet(previousInput);
    const previousIncome = calculateIncomeStatement(previousInput);
    const previousCashFlow = calculateCashFlowStatement(previousIncome, previousBalance);

    comparison = calculatePeriodComparison(
      incomeStatement,
      previousIncome,
      cashFlowStatement,
      previousCashFlow
    );

    trendAnalysis = analyzeTrends(incomeStatement, previousIncome, revenueAgg.byMonth);
  } else {
    comparison = {
      current: {
        revenue: incomeStatement.revenue.total,
        expenses: incomeStatement.operatingExpenses.total + incomeStatement.costOfRevenue.total,
        netIncome: incomeStatement.netIncome,
        cashFlow: cashFlowStatement.netCashFlow
      },
      previous: { revenue: 0, expenses: 0, netIncome: 0, cashFlow: 0 },
      change: { revenue: 0, expenses: 0, netIncome: 0, cashFlow: 0 },
      changePercentage: { revenue: 0, expenses: 0, netIncome: 0, cashFlow: 0 }
    };

    trendAnalysis = {
      revenue: { trend: 'stable', growthRate: 0, volatility: 0, seasonality: false },
      expenses: { trend: 'stable', growthRate: 0, volatility: 0 },
      profitability: { trend: 'stable', changeRate: 0 },
      cashFlow: { trend: 'stable', averageMonthly: 0 }
    };
  }

  const alerts = generateFinancialAlerts(ratios, trendAnalysis, cashFlowStatement);
  const recommendations = generateRecommendations(ratios, trendAnalysis, alerts);
  const financialHealth = calculateFinancialHealthScore(ratios, trendAnalysis, alerts);

  const keyHighlights = generateKeyHighlights(incomeStatement, ratios, trendAnalysis);
  const majorConcerns = generateMajorConcerns(alerts);

  const charts = generateChartData(revenueAgg, paymentAgg, incomeStatement, cashFlowStatement);

  const reportData: FinancialReportData = {
    reportInfo: {
      reportNumber,
      generatedDate: new Date(),
      generatedBy: 'System',
      period: configuration.period,
      configuration
    },
    executiveSummary: {
      keyHighlights,
      majorConcerns,
      topRecommendations: recommendations.slice(0, 5).map(r => r.title),
      financialHealth
    },
    balanceSheet,
    incomeStatement,
    cashFlowStatement,
    ratios,
    trendAnalysis,
    comparison,
    alerts,
    recommendations,
    charts
  };

  const pdfBlob = await generateFinancialReportPDF(reportData);

  return { reportData, pdfBlob };
}

function generateReportNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RF-${year}${month}-${random}`;
}

function generateKeyHighlights(
  income: any,
  ratios: any,
  trend: any
): string[] {
  const highlights: string[] = [];

  if (income.revenue.total > 0) {
    highlights.push(
      `Chiffre d'affaires total: ${formatAmount(income.revenue.total)}`
    );
  }

  if (income.netMargin > 15) {
    highlights.push(
      `Excellente marge nette de ${income.netMargin.toFixed(1)}%, bien au-dessus de l'objectif de 10%`
    );
  }

  if (ratios.liquidity.currentRatio > 2) {
    highlights.push(
      `Très bonne liquidité avec un ratio de ${ratios.liquidity.currentRatio.toFixed(2)}`
    );
  }

  if (trend.revenue.trend === 'increasing') {
    highlights.push(
      `Croissance des revenus de ${trend.revenue.growthRate.toFixed(1)}% par rapport à la période précédente`
    );
  }

  if (ratios.profitability.returnOnEquity > 20) {
    highlights.push(
      `Rentabilité des capitaux propres exceptionnelle à ${ratios.profitability.returnOnEquity.toFixed(1)}%`
    );
  }

  if (highlights.length === 0) {
    highlights.push('Activité opérationnelle maintenue sur la période');
  }

  return highlights;
}

function generateMajorConcerns(alerts: any[]): string[] {
  return alerts
    .filter(alert => alert.severity === 'critical' || alert.severity === 'high')
    .slice(0, 5)
    .map(alert => alert.description);
}

function generateChartData(
  revenueAgg: any,
  paymentAgg: any,
  income: any,
  cashFlow: any
): any {
  const monthLabels = Object.keys(revenueAgg.byMonth).sort();
  const monthlyRevenues = monthLabels.map(month => revenueAgg.byMonth[month]);

  return {
    revenueEvolution: {
      type: 'bar',
      title: 'Évolution du Chiffre d\'Affaires',
      labels: monthLabels,
      datasets: [{
        label: 'Revenus',
        data: monthlyRevenues,
        color: '#2563eb',
        backgroundColor: '#2563eb'
      }]
    },
    expenseBreakdown: {
      type: 'pie',
      title: 'Répartition des Charges',
      labels: ['Salaires', 'Fournitures', 'Loyer', 'Autres'],
      datasets: [{
        label: 'Montant',
        data: [
          income.operatingExpenses.salaries,
          income.costOfRevenue.total,
          income.operatingExpenses.rent,
          income.operatingExpenses.utilities + income.operatingExpenses.maintenance
        ],
        color: '#10b981',
        backgroundColor: '#10b981'
      }]
    },
    cashFlowTrend: {
      type: 'line',
      title: 'Flux de Trésorerie',
      labels: ['Début', 'Fin'],
      datasets: [{
        label: 'Trésorerie',
        data: [cashFlow.beginningCash, cashFlow.endingCash],
        color: '#f59e0b',
        backgroundColor: '#f59e0b'
      }]
    },
    profitabilityTrend: {
      type: 'line',
      title: 'Évolution de la Rentabilité',
      labels: monthLabels,
      datasets: [{
        label: 'Marge Nette',
        data: monthlyRevenues.map(() => income.netMargin),
        color: '#10b981',
        backgroundColor: '#10b981'
      }]
    },
    revenueByService: {
      type: 'doughnut',
      title: 'Revenus par Service',
      labels: ['Consultations', 'Procédures', 'Pharmacie', 'Laboratoire'],
      datasets: [{
        label: 'Revenus',
        data: [
          income.revenue.consultations,
          income.revenue.procedures,
          income.revenue.pharmacy,
          income.revenue.laboratory
        ],
        color: '#2563eb',
        backgroundColor: '#2563eb'
      }]
    }
  };
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
