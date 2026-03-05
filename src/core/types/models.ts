import {
  UserRole,
  AppointmentStatus,
  LabOrderStatus,
  PrescriptionStatus,
  NotificationType,
  NotificationPriority,
  PaymentStatus,
  ConsultationType,
  FacilityType
} from './enums';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  facility_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  facility_id?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
  settings?: Record<string, any>;
  created_at: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  insurance_number?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  blood_type?: string;
  user_id?: string;
  facility_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  license_number: string;
  phone: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  facility_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  facility_id?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: AppointmentStatus;
  type: ConsultationType;
  reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface Consultation {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  facility_id?: string;
  chief_complaint: string;
  history_present_illness?: string;
  physical_examination?: string;
  vital_signs?: VitalSigns;
  diagnosis?: string;
  icd_codes?: string[];
  treatment_plan?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VitalSigns {
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface LabOrder {
  id: string;
  patient_id: string;
  doctor_id: string;
  consultation_id?: string;
  facility_id?: string;
  test_type: string;
  test_name: string;
  clinical_indication: string;
  urgency: 'routine' | 'urgent' | 'stat';
  status: LabOrderStatus;
  sample_collected_at?: string;
  results?: any;
  results_file_url?: string;
  technician_notes?: string;
  validated_by?: string;
  validated_at?: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  consultation_id?: string;
  facility_id?: string;
  status: PrescriptionStatus;
  medications: Medication[];
  notes?: string;
  valid_until?: string;
  dispensed_at?: string;
  dispensed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  patient_id: string;
  facility_id?: string;
  invoice_number: string;
  date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number;
  balance: number;
  status: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  service_type?: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  patient_id: string;
  facility_id?: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface DashboardStats {
  today_appointments: number;
  pending_lab_orders: number;
  active_prescriptions: number;
  total_patients: number;
  revenue_today: number;
  revenue_month: number;
  occupancy_rate: number;
}
