export type ContractType = 'CDI' | 'CDD' | 'Stage' | 'Freelance' | 'Interim';

export type ContractStatus =
  | 'draft'
  | 'active'
  | 'expired'
  | 'terminated'
  | 'pending_renewal';

export interface EmployeeContract {
  id: string;
  employee_id: string;
  contract_number: string;
  contract_type: ContractType;
  start_date: string;
  end_date: string | null;
  duration_months: number | null;
  position: string;
  department_id: string | null;
  base_salary_cdf: number;
  base_salary_usd: number | null;
  benefits: Record<string, any> | null;
  contract_document_url: string | null;
  contract_status: ContractStatus;
  renewal_alert_days: number;
  renewal_count: number;
  previous_contract_id: string | null;
  termination_date: string | null;
  termination_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ContractWithEmployee extends EmployeeContract {
  employee_name: string;
  employee_email: string;
  department_name: string | null;
}

export interface ContractFormData {
  employee_id: string;
  contract_type: ContractType;
  contract_number?: string;
  start_date: string;
  end_date?: string | null;
  duration_months?: number | null;
  position: string;
  department_id?: string | null;
  base_salary_cdf: number;
  base_salary_usd?: number | null;
  benefits?: Record<string, any> | null;
  renewal_alert_days?: number;
  notes?: string | null;
}

export interface ContractStats {
  total: number;
  active: number;
  expiring_soon: number;
  expired: number;
}
