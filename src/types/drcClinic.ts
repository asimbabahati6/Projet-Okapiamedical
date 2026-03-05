// Types for DRC Medical Clinic Management System

export interface ExchangeRate {
  id: string;
  rate_date: string;
  cdf_to_usd: number;
  usd_to_cdf: number;
  set_by?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  code: string;
  type: 'mutual' | 'corporate' | 'government' | 'private';
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  tiers_payant_available?: boolean;
  electronic_billing_enabled?: boolean;
  api_endpoint?: string;
  contract_types?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientInsurance {
  id: string;
  patient_id: string;
  provider_id: string;
  policy_number: string;
  voucher_number?: string;
  coverage_start: string;
  coverage_end: string;
  coverage_percentage: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  provider?: InsuranceProvider;
}

export interface Employee {
  id: string;
  user_profile_id?: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  city: string;
  country: string;
  national_id?: string;
  photo_url?: string;
  department?: string;
  position: string;
  employment_type: 'permanent' | 'fixed_term' | 'contractor' | 'intern';
  hire_date: string;
  probation_end_date?: string;
  termination_date?: string;
  professional_registration_number?: string;
  medical_specialty?: string;
  is_medical_staff: boolean;
  status: 'active' | 'on_leave' | 'suspended' | 'terminated';
  created_at: string;
  updated_at: string;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_type: 'contract' | 'diploma' | 'certificate' | 'id_card' | 'cv' | 'medical_cert' | 'other';
  document_name: string;
  file_url: string;
  file_size?: number;
  uploaded_by?: string;
  notes?: string;
  created_at: string;
}

export interface EmployeeContract {
  id: string;
  employee_id: string;
  contract_type: 'permanent' | 'fixed_term' | 'contractor' | 'intern';
  contract_number: string;
  start_date: string;
  end_date?: string;
  probation_period_months: number;
  probation_end_date?: string;
  position: string;
  department?: string;
  base_salary_cdf: number;
  base_salary_usd?: number;
  transport_allowance_cdf: number;
  housing_allowance_cdf: number;
  other_allowances_cdf: number;
  work_hours_per_week: number;
  contract_status: 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
  signed_date?: string;
  termination_date?: string;
  termination_reason?: string;
  renewal_count: number;
  notes?: string;
  alert_30_days: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface ShiftType {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  shift_category: 'day' | 'night' | 'weekend' | 'holiday';
  min_rest_hours: number;
  color_code?: string;
  created_at: string;
}

export interface ShiftSchedule {
  id: string;
  employee_id: string;
  shift_type_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  assigned_by?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  shift_type?: ShiftType;
}

export interface TaxBracket {
  id: string;
  bracket_name: string;
  min_amount_cdf: number;
  max_amount_cdf?: number;
  tax_rate: number;
  fixed_amount_cdf: number;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
  created_at: string;
}

export interface PayrollPeriod {
  id: string;
  period_name: string;
  period_start: string;
  period_end: string;
  payment_date?: string;
  status: 'draft' | 'processing' | 'approved' | 'paid' | 'cancelled';
  exchange_rate_id?: string;
  total_gross_cdf: number;
  total_net_cdf: number;
  total_cnss_employee_cdf: number;
  total_cnss_employer_cdf: number;
  total_ipr_cdf: number;
  processed_by?: string;
  approved_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  exchange_rate?: ExchangeRate;
}

export interface PayrollItem {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  payslip_number: string;
  base_salary_cdf: number;
  transport_allowance_cdf: number;
  housing_allowance_cdf: number;
  other_allowances_cdf: number;
  total_bonuses_cdf: number;
  gross_salary_cdf: number;
  cnss_employee_cdf: number;
  cnss_employer_cdf: number;
  ipr_tax_cdf: number;
  other_deductions_cdf: number;
  total_deductions_cdf: number;
  net_salary_cdf: number;
  payment_method: 'bank_transfer' | 'cash' | 'mobile_money' | 'check';
  payment_status: 'pending' | 'paid' | 'cancelled';
  payment_reference?: string;
  payment_date?: string;
  notes?: string;
  calculated_by?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  payroll_period?: PayrollPeriod;
}

export interface MedicationBatch {
  id: string;
  medication_id: string;
  batch_number: string;
  quantity: number;
  unit_cost_cdf?: number;
  unit_cost_usd?: number;
  manufacture_date?: string;
  expiry_date: string;
  supplier?: string;
  received_date: string;
  status: 'active' | 'expired' | 'recalled' | 'depleted';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationStockAlert {
  id: string;
  alert_type: 'low_stock' | 'expiring_soon' | 'expired' | 'out_of_stock';
  medication_id?: string;
  batch_id?: string;
  alert_message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface DashboardKPIs {
  daily_patients: number;
  staff_on_duty: number;
  critical_stock_alerts: number;
  monthly_revenue_cdf: number;
  monthly_revenue_usd: number;
  contracts_expiring_30_days: number;
  medications_expiring_soon: number;
}
