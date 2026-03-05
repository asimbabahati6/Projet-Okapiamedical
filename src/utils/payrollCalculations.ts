import { TaxBracket } from '../types/drcClinic';

// DRC CNSS Rates
export const CNSS_EMPLOYEE_RATE = 0.05; // 5%
export const CNSS_EMPLOYER_RATE = 0.13; // 13%

/**
 * Calculate CNSS employee contribution (5% of gross salary)
 */
export function calculateCNSSEmployee(grossSalary: number): number {
  return Math.round(grossSalary * CNSS_EMPLOYEE_RATE);
}

/**
 * Calculate CNSS employer contribution (13% of gross salary)
 */
export function calculateCNSSEmployer(grossSalary: number): number {
  return Math.round(grossSalary * CNSS_EMPLOYER_RATE);
}

/**
 * Calculate DRC IPR (Impôt Professionnel sur les Rémunérations) tax
 * Using progressive tax brackets
 */
export function calculateIPRTax(taxableIncome: number, taxBrackets: TaxBracket[]): number {
  // Sort brackets by min amount
  const sortedBrackets = [...taxBrackets].sort((a, b) => a.min_amount_cdf - b.min_amount_cdf);

  let totalTax = 0;

  for (const bracket of sortedBrackets) {
    const minAmount = bracket.min_amount_cdf;
    const maxAmount = bracket.max_amount_cdf || Infinity;
    const rate = bracket.tax_rate / 100;
    const fixedAmount = bracket.fixed_amount_cdf;

    if (taxableIncome > minAmount) {
      if (taxableIncome <= maxAmount) {
        // Income falls within this bracket
        const amountInBracket = taxableIncome - minAmount;
        totalTax = fixedAmount + (amountInBracket * rate);
        break;
      }
    }
  }

  return Math.round(totalTax);
}

/**
 * Calculate complete payroll for an employee
 */
export interface PayrollCalculation {
  baseSalary: number;
  transportAllowance: number;
  housingAllowance: number;
  otherAllowances: number;
  totalBonuses: number;
  grossSalary: number;
  cnssEmployee: number;
  cnssEmployer: number;
  iprTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
}

export function calculatePayroll(
  baseSalary: number,
  transportAllowance: number,
  housingAllowance: number,
  otherAllowances: number,
  bonuses: number,
  taxBrackets: TaxBracket[],
  otherDeductions: number = 0
): PayrollCalculation {
  // Calculate gross salary
  const grossSalary = baseSalary + transportAllowance + housingAllowance + otherAllowances + bonuses;

  // Calculate CNSS contributions
  const cnssEmployee = calculateCNSSEmployee(grossSalary);
  const cnssEmployer = calculateCNSSEmployer(grossSalary);

  // Taxable income = gross - CNSS employee contribution
  const taxableIncome = grossSalary - cnssEmployee;

  // Calculate IPR tax
  const iprTax = calculateIPRTax(taxableIncome, taxBrackets);

  // Total deductions
  const totalDeductions = cnssEmployee + iprTax + otherDeductions;

  // Net salary
  const netSalary = grossSalary - totalDeductions;

  return {
    baseSalary,
    transportAllowance,
    housingAllowance,
    otherAllowances,
    totalBonuses: bonuses,
    grossSalary,
    cnssEmployee,
    cnssEmployer,
    iprTax,
    otherDeductions,
    totalDeductions,
    netSalary
  };
}

/**
 * Format CDF currency
 */
export function formatCDF(amount: number): string {
  return new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'CDF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format USD currency
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Convert CDF to USD
 */
export function convertCDFToUSD(amountCDF: number, exchangeRate: number): number {
  return amountCDF * exchangeRate;
}

/**
 * Convert USD to CDF
 */
export function convertUSDToCDF(amountUSD: number, exchangeRate: number): number {
  return amountUSD * exchangeRate;
}
