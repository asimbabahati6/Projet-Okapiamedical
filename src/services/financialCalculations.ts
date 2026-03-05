import {
  BalanceSheet,
  IncomeStatement,
  CashFlowStatement,
  FinancialRatios,
  PeriodComparison
} from '../types/financialReport';
import { Invoice, PaymentHistory } from '../types/database';

interface CalculationInput {
  invoices: Invoice[];
  payments: PaymentHistory[];
  salaryExpenses: number;
  suppliesExpenses: number;
  otherExpenses: {
    rent: number;
    utilities: number;
    maintenance: number;
    insurance: number;
    marketing: number;
    administrative: number;
  };
}

export function calculateBalanceSheet(input: CalculationInput): BalanceSheet {
  const totalReceivables = input.invoices
    .filter(inv => inv.status === 'pending' || inv.status === 'partial')
    .reduce((sum, inv) => sum + inv.balance, 0);

  const totalCash = input.payments.reduce((sum, p) => sum + p.payment_amount, 0);

  const assets = {
    current: {
      cash: totalCash,
      accountsReceivable: totalReceivables,
      inventory: input.suppliesExpenses * 0.3,
      other: 0,
      total: 0
    },
    nonCurrent: {
      equipment: 0,
      property: 0,
      investments: 0,
      other: 0,
      total: 0
    },
    total: 0
  };

  assets.current.total = assets.current.cash + assets.current.accountsReceivable +
    assets.current.inventory + assets.current.other;
  assets.nonCurrent.total = assets.nonCurrent.equipment + assets.nonCurrent.property +
    assets.nonCurrent.investments + assets.nonCurrent.other;
  assets.total = assets.current.total + assets.nonCurrent.total;

  const totalExpenses = input.salaryExpenses + input.suppliesExpenses +
    Object.values(input.otherExpenses).reduce((sum, exp) => sum + exp, 0);

  const liabilities = {
    current: {
      accountsPayable: totalExpenses * 0.2,
      shortTermDebt: 0,
      accruedExpenses: input.salaryExpenses * 0.1,
      other: 0,
      total: 0
    },
    nonCurrent: {
      longTermDebt: 0,
      deferredRevenue: 0,
      other: 0,
      total: 0
    },
    total: 0
  };

  liabilities.current.total = liabilities.current.accountsPayable + liabilities.current.shortTermDebt +
    liabilities.current.accruedExpenses + liabilities.current.other;
  liabilities.nonCurrent.total = liabilities.nonCurrent.longTermDebt + liabilities.nonCurrent.deferredRevenue +
    liabilities.nonCurrent.other;
  liabilities.total = liabilities.current.total + liabilities.nonCurrent.total;

  const totalRevenue = input.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  const equity = {
    capital: 0,
    retainedEarnings: 0,
    currentPeriodProfit: netIncome,
    total: 0
  };

  equity.total = assets.total - liabilities.total;
  equity.capital = equity.total - equity.currentPeriodProfit;

  return { assets, liabilities, equity };
}

export function calculateIncomeStatement(input: CalculationInput): IncomeStatement {
  const totalRevenue = input.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);

  const revenue = {
    consultations: totalRevenue * 0.4,
    procedures: totalRevenue * 0.3,
    pharmacy: totalRevenue * 0.2,
    laboratory: totalRevenue * 0.1,
    other: 0,
    total: totalRevenue
  };

  const costOfRevenue = {
    medicalSupplies: input.suppliesExpenses * 0.3,
    pharmacyInventory: input.suppliesExpenses * 0.5,
    laboratorySupplies: input.suppliesExpenses * 0.2,
    total: input.suppliesExpenses
  };

  const grossProfit = revenue.total - costOfRevenue.total;
  const grossMargin = revenue.total > 0 ? (grossProfit / revenue.total) * 100 : 0;

  const operatingExpenses = {
    salaries: input.salaryExpenses,
    rent: input.otherExpenses.rent,
    utilities: input.otherExpenses.utilities,
    maintenance: input.otherExpenses.maintenance,
    insurance: input.otherExpenses.insurance,
    marketing: input.otherExpenses.marketing,
    administrative: input.otherExpenses.administrative,
    depreciation: 0,
    other: 0,
    total: 0
  };

  operatingExpenses.total = Object.values(operatingExpenses).reduce((sum, exp) => sum + exp, 0);

  const operatingIncome = grossProfit - operatingExpenses.total;
  const operatingMargin = revenue.total > 0 ? (operatingIncome / revenue.total) * 100 : 0;

  const otherIncome = 0;
  const otherExpenses = 0;
  const netIncome = operatingIncome + otherIncome - otherExpenses;
  const netMargin = revenue.total > 0 ? (netIncome / revenue.total) * 100 : 0;

  return {
    revenue,
    costOfRevenue,
    grossProfit,
    grossMargin,
    operatingExpenses,
    operatingIncome,
    operatingMargin,
    otherIncome,
    otherExpenses,
    netIncome,
    netMargin
  };
}

export function calculateCashFlowStatement(
  incomeStatement: IncomeStatement,
  balanceSheet: BalanceSheet
): CashFlowStatement {
  const operatingActivities = {
    netIncome: incomeStatement.netIncome,
    depreciation: incomeStatement.operatingExpenses.depreciation,
    accountsReceivableChange: -balanceSheet.assets.current.accountsReceivable * 0.1,
    inventoryChange: -balanceSheet.assets.current.inventory * 0.05,
    accountsPayableChange: balanceSheet.liabilities.current.accountsPayable * 0.1,
    other: 0,
    total: 0
  };

  operatingActivities.total = Object.values(operatingActivities).reduce((sum, val) => sum + val, 0);

  const investingActivities = {
    equipmentPurchases: 0,
    equipmentSales: 0,
    investments: 0,
    other: 0,
    total: 0
  };

  investingActivities.total = Object.values(investingActivities).reduce((sum, val) => sum + val, 0);

  const financingActivities = {
    debtIssuance: 0,
    debtRepayment: 0,
    equityIssuance: 0,
    dividends: 0,
    other: 0,
    total: 0
  };

  financingActivities.total = Object.values(financingActivities).reduce((sum, val) => sum + val, 0);

  const netCashFlow = operatingActivities.total + investingActivities.total + financingActivities.total;
  const beginningCash = balanceSheet.assets.current.cash - netCashFlow;
  const endingCash = balanceSheet.assets.current.cash;

  return {
    operatingActivities,
    investingActivities,
    financingActivities,
    netCashFlow,
    beginningCash: Math.max(0, beginningCash),
    endingCash
  };
}

export function calculateFinancialRatios(
  balanceSheet: BalanceSheet,
  incomeStatement: IncomeStatement,
  patientCount: number
): FinancialRatios {
  const liquidity = {
    currentRatio: balanceSheet.liabilities.current.total > 0
      ? balanceSheet.assets.current.total / balanceSheet.liabilities.current.total
      : 0,
    quickRatio: balanceSheet.liabilities.current.total > 0
      ? (balanceSheet.assets.current.total - balanceSheet.assets.current.inventory) /
        balanceSheet.liabilities.current.total
      : 0,
    cashRatio: balanceSheet.liabilities.current.total > 0
      ? balanceSheet.assets.current.cash / balanceSheet.liabilities.current.total
      : 0,
    workingCapital: balanceSheet.assets.current.total - balanceSheet.liabilities.current.total
  };

  const profitability = {
    grossMargin: incomeStatement.grossMargin,
    operatingMargin: incomeStatement.operatingMargin,
    netMargin: incomeStatement.netMargin,
    returnOnAssets: balanceSheet.assets.total > 0
      ? (incomeStatement.netIncome / balanceSheet.assets.total) * 100
      : 0,
    returnOnEquity: balanceSheet.equity.total > 0
      ? (incomeStatement.netIncome / balanceSheet.equity.total) * 100
      : 0,
    revenuePerPatient: patientCount > 0
      ? incomeStatement.revenue.total / patientCount
      : 0
  };

  const efficiency = {
    assetTurnover: balanceSheet.assets.total > 0
      ? incomeStatement.revenue.total / balanceSheet.assets.total
      : 0,
    receivablesTurnover: balanceSheet.assets.current.accountsReceivable > 0
      ? incomeStatement.revenue.total / balanceSheet.assets.current.accountsReceivable
      : 0,
    daysRevenueOutstanding: balanceSheet.assets.current.accountsReceivable > 0 && incomeStatement.revenue.total > 0
      ? (balanceSheet.assets.current.accountsReceivable / incomeStatement.revenue.total) * 365
      : 0,
    inventoryTurnover: balanceSheet.assets.current.inventory > 0
      ? incomeStatement.costOfRevenue.total / balanceSheet.assets.current.inventory
      : 0,
    daysInventoryOutstanding: balanceSheet.assets.current.inventory > 0 && incomeStatement.costOfRevenue.total > 0
      ? (balanceSheet.assets.current.inventory / incomeStatement.costOfRevenue.total) * 365
      : 0
  };

  const leverage = {
    debtToAssets: balanceSheet.assets.total > 0
      ? (balanceSheet.liabilities.total / balanceSheet.assets.total) * 100
      : 0,
    debtToEquity: balanceSheet.equity.total > 0
      ? (balanceSheet.liabilities.total / balanceSheet.equity.total) * 100
      : 0,
    equityMultiplier: balanceSheet.equity.total > 0
      ? balanceSheet.assets.total / balanceSheet.equity.total
      : 0,
    interestCoverage: 0
  };

  return { liquidity, profitability, efficiency, leverage };
}

export function calculatePeriodComparison(
  currentIncome: IncomeStatement,
  previousIncome: IncomeStatement,
  currentCashFlow: CashFlowStatement,
  previousCashFlow: CashFlowStatement
): PeriodComparison {
  const current = {
    revenue: currentIncome.revenue.total,
    expenses: currentIncome.operatingExpenses.total + currentIncome.costOfRevenue.total,
    netIncome: currentIncome.netIncome,
    cashFlow: currentCashFlow.netCashFlow
  };

  const previous = {
    revenue: previousIncome.revenue.total,
    expenses: previousIncome.operatingExpenses.total + previousIncome.costOfRevenue.total,
    netIncome: previousIncome.netIncome,
    cashFlow: previousCashFlow.netCashFlow
  };

  const change = {
    revenue: current.revenue - previous.revenue,
    expenses: current.expenses - previous.expenses,
    netIncome: current.netIncome - previous.netIncome,
    cashFlow: current.cashFlow - previous.cashFlow
  };

  const changePercentage = {
    revenue: previous.revenue > 0 ? (change.revenue / previous.revenue) * 100 : 0,
    expenses: previous.expenses > 0 ? (change.expenses / previous.expenses) * 100 : 0,
    netIncome: previous.netIncome > 0 ? (change.netIncome / previous.netIncome) * 100 : 0,
    cashFlow: previous.cashFlow > 0 ? (change.cashFlow / previous.cashFlow) * 100 : 0
  };

  return { current, previous, change, changePercentage };
}
