export interface DashboardKPIs {
  daily_patients: number;
  staff_on_duty: number;
  critical_stock_alerts: number;
  monthly_revenue_cdf: number;
  monthly_revenue_usd: number;
  contracts_expiring_30_days: number;
  medications_expiring_soon: number;
}

export interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  hire_date: string | null;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  contract_type: string | null;
  base_salary_cdf: number | null;
  profile_photo_url: string | null;
  photo_url?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  employment_type?: string | null;
  is_medical_staff?: boolean;
  medical_specialty?: string | null;
  professional_registration_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeContract {
  id: string;
  employee_id: string;
  contract_type: string;
  start_date: string;
  end_date: string | null;
  contract_status: 'active' | 'expired' | 'terminated' | 'pending';
  base_salary_cdf: number;
  transport_allowance_cdf: number;
  housing_allowance_cdf: number;
  other_allowances_cdf: number;
  created_at: string;
  updated_at: string;
}

export interface TaxBracket {
  id: string;
  min_amount_cdf: number;
  max_amount_cdf: number | null;
  rate_percentage: number;
  fixed_amount_cdf: number;
  is_active: boolean;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  usd_to_cdf: number;
  rate_date: string;
  is_active: boolean;
  created_at: string;
}

export interface ShiftType {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  color: string | null;
  color_code?: string | null;
  min_rest_hours?: number;
  is_active: boolean;
}

export interface ShiftSchedule {
  id: string;
  employee_id: string;
  shift_type_id: string;
  schedule_date: string;
  start_time?: string | null;
  end_time?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'absent' | 'confirmed';
  notes: string | null;
  created_at: string;
  employee?: Employee;
  shift_type?: ShiftType;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  code: string | null;
  type?: string | null;
  contact_person: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  coverage_percentage: number;
  tiers_payant_available?: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollPeriod {
  id: string;
  period_name: string;
  period_start: string;
  period_end: string;
  payment_date: string | null;
  status: 'draft' | 'processing' | 'approved' | 'paid' | 'cancelled';
  exchange_rate_id: string | null;
  total_gross_cdf: number;
  total_net_cdf: number;
  total_cnss_employee_cdf: number;
  total_cnss_employer_cdf: number;
  total_ipr_cdf: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  exchange_rate?: ExchangeRate;
}
