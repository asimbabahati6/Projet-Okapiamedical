import { Consultation, Patient, MedicalStaff, UserProfile } from './database';

export interface ConsultationWithDetails extends Consultation {
  patient?: Patient;
  doctor?: MedicalStaff & { user_profile?: UserProfile };
  can_edit?: boolean;
  can_delete?: boolean;
}

export interface ConsultationFilters {
  startDate?: Date;
  endDate?: Date;
  doctorId?: string;
  patientId?: string;
  departmentId?: string;
  diagnosisSearch?: string;
  statusFilter?: 'all' | 'with_follow_up' | 'follow_up_pending' | 'follow_up_overdue';
  searchTerm?: string;
}

export interface ConsultationStatistics {
  total_consultations: number;
  with_follow_up: number;
  follow_up_completed?: number;
  follow_up_pending?: number;
  follow_up_overdue?: number;
  unique_patients: number;
  unique_doctors: number;
  avg_consultations_per_day?: number;
  top_diagnoses?: Array<{ diagnosis: string; count: number }>;
}

export interface TimeSeriesData {
  period: Date;
  count: number;
}

export interface DiagnosisDistribution {
  diagnosis: string;
  count: number;
  percentage: number;
}

export interface ConsultationAuditLog {
  id: string;
  consultation_id: string;
  user_id: string;
  action: 'viewed' | 'created' | 'updated' | 'deleted' | 'exported_pdf' | 'exported_excel' | 'exported_csv' | 'shared' | 'printed';
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_at: string;
  user?: UserProfile;
}

export interface Permissions {
  can_view_own: boolean;
  can_view_department: boolean;
  can_view_all: boolean;
  can_create: boolean;
  can_edit_own: boolean;
  can_edit_all: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_share: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
  label?: string;
}

export interface ChartDataPoint {
  x: number | Date;
  y: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface HeatmapCell {
  date: Date;
  value: number;
  day: number;
  week: number;
}

export type ViewMode = 'list' | 'charts' | 'calendar' | 'analytics';
export type ChartType = 'timeline' | 'diagnosis' | 'heatmap' | 'network' | 'comparison';
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';
export type SortField = 'consultation_date' | 'patient_name' | 'doctor_name' | 'diagnosis' | 'follow_up_date';
export type SortDirection = 'asc' | 'desc';
