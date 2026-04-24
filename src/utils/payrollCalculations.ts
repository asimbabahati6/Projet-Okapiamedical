import type { TaxBracket } from '../types/drcClinic';

export function formatCDF(amount: number): string {
  return new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', minimumFractionDigits: 0 }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

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

const CNSS_EMPLOYEE_RATE = 0.05;
const CNSS_EMPLOYER_RATE = 0.13;

function calculateIPR(taxableIncome: number, brackets: TaxBracket[]): number {
  if (!brackets.length) return 0;
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min_amount_cdf) continue;
    const maxAmount = bracket.max_amount_cdf ?? Infinity;
    const taxable = Math.min(taxableIncome, maxAmount) - bracket.min_amount_cdf;
    if (taxable <= 0) continue;
    tax += taxable * (bracket.rate_percentage / 100) + bracket.fixed_amount_cdf;
    if (bracket.max_amount_cdf === null) break;
  }
  return Math.max(0, tax);
}

export function calculatePayroll(
  baseSalaryCDF: number,
  transportAllowanceCDF: number,
  housingAllowanceCDF: number,
  otherAllowancesCDF: number,
  otherDeductionsCDF: number,
  taxBrackets: TaxBracket[]
): PayrollCalculation {
  const totalBonuses = 0;
  const grossSalary = baseSalaryCDF + transportAllowanceCDF + housingAllowanceCDF + otherAllowancesCDF + totalBonuses;
  const cnssEmployee = grossSalary * CNSS_EMPLOYEE_RATE;
  const cnssEmployer = grossSalary * CNSS_EMPLOYER_RATE;
  const taxableIncome = grossSalary - cnssEmployee;
  const iprTax = calculateIPR(taxableIncome, taxBrackets);
  const totalDeductions = cnssEmployee + iprTax + otherDeductionsCDF;
  const netSalary = grossSalary - totalDeductions;

  return {
    baseSalary: baseSalaryCDF,
    transportAllowance: transportAllowanceCDF,
    housingAllowance: housingAllowanceCDF,
    otherAllowances: otherAllowancesCDF,
    totalBonuses,
    grossSalary,
    cnssEmployee,
    cnssEmployer,
    iprTax,
    otherDeductions: otherDeductionsCDF,
    totalDeductions,
    netSalary,
  };
}
