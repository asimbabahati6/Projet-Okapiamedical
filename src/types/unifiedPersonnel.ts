/**
 * Types pour le Système de Gestion Unifiée du Personnel
 * Intègre les données RH et Médicales en une vue consolidée
 */

export type EmployeeCategory = 'medical' | 'administrative' | 'support' | 'hybrid';
export type ProfileType = 'hybrid' | 'medical' | 'administrative' | 'none';
export type EmploymentStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export type ContractType = 'permanent' | 'temporary' | 'consultant';

/**
 * Vue unifiée d'un employé combinant toutes les sources de données
 */
export interface UnifiedEmployee {
  // Core Identity
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  employee_category: EmployeeCategory | null;
  is_medical_staff: boolean;
  is_hr_employee: boolean;
  profile_is_active: boolean;

  // Role & Department
  role_name: string | null;
  department_name: string | null;
  department_id: string | null;
  department_email: string | null;
  department_phone: string | null;

  // HR Employee Data
  employee_number: string | null;
  hire_date: string | null;
  employment_status: EmploymentStatus | null;
  contract_type: ContractType | null;
  salary_amount: number | null;
  salary_currency: string | null;
  bank_name: string | null;
  bank_account: string | null;
  tax_id: string | null;
  social_security_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;

  // Medical Staff Data
  license_number: string | null;
  specialization: string | null;
  staff_type: string | null;
  medical_category: string | null;
  years_of_experience: number | null;
  consultation_fee: number | null;
  is_accepting_patients: boolean | null;
  telemedicine_enabled: boolean | null;
  rpps_number: string | null;
  adeli_number: string | null;
  can_prescribe_controlled_substances: boolean | null;
  average_rating: number | null;
  total_consultations: number | null;
  medical_status: string | null;

  // Computed Fields
  profile_type: ProfileType;
  profile_completeness: number;
  is_active: boolean;

  // Timestamps
  profile_created_at: string;
  profile_updated_at: string;
}

/**
 * Statistiques globales du personnel
 */
export interface EmployeeStatistics {
  total_employees: number;
  active_employees: number;
  medical_staff_count: number;
  administrative_staff_count: number;
  hybrid_staff_count: number;
  avg_profile_completeness: number;
  incomplete_profiles: number;
}

/**
 * Filtres pour la recherche unifiée
 */
export interface UnifiedEmployeeFilters {
  searchTerm?: string;
  category?: ProfileType | 'all';
  status?: 'active' | 'inactive' | 'all';
  department?: string;
  minCompleteness?: number;
}

/**
 * Options de tri
 */
export type SortField = 'full_name' | 'hire_date' | 'profile_completeness' | 'department_name';
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  direction: SortDirection;
}

/**
 * Résultat de recherche paginé
 */
export interface UnifiedEmployeeSearchResult {
  employees: UnifiedEmployee[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Badge de statut pour l'affichage
 */
export interface StatusBadge {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  icon?: string;
}

/**
 * Action rapide disponible sur un employé
 */
export interface EmployeeQuickAction {
  id: string;
  label: string;
  icon: string;
  action: (employee: UnifiedEmployee) => void;
  visible: (employee: UnifiedEmployee) => boolean;
  disabled?: (employee: UnifiedEmployee) => boolean;
}

/**
 * Configuration de vue pour l'affichage personnalisé
 */
export interface ViewConfiguration {
  showMedicalInfo: boolean;
  showHRInfo: boolean;
  showContactInfo: boolean;
  showFinancialInfo: boolean;
  compactMode: boolean;
}

/**
 * Données d'export
 */
export interface EmployeeExportData {
  format: 'excel' | 'pdf' | 'csv';
  fields: string[];
  includeInactive: boolean;
  filters?: UnifiedEmployeeFilters;
}

/**
 * Événement du cycle de vie d'un employé
 */
export interface EmployeeLifecycleEvent {
  id: string;
  employee_id: string;
  event_type: 'hired' | 'promoted' | 'transferred' | 'terminated' | 'credential_updated';
  event_date: string;
  details: Record<string, any>;
  created_by: string;
  created_at: string;
}
