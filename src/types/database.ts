export type StaffType =
  | 'medecin'
  | 'dentiste'
  | 'infirmier'
  | 'infirmier_specialise'
  | 'aide_soignant'
  | 'technicien_laboratoire'
  | 'technicien_radiologie'
  | 'technicien_anesthesie'
  | 'kinesitherapeute'
  | 'ergotherapeute'
  | 'orthophoniste'
  | 'psychologue'
  | 'dieteticien'
  | 'assistant_medical'
  | 'secretaire_medical'
  | 'pharmacien'
  | 'preparateur_pharmacie'
  | 'travailleur_social'
  | 'ambulancier'
  | 'autre';

export type StaffCategory =
  | 'medical'
  | 'nursing'
  | 'technical'
  | 'therapy'
  | 'administrative'
  | 'pharmacy'
  | 'support'
  | 'other';

export interface PatientStatus {
  isNewPatient: boolean;
  primaryCarePhysicianId: string | null;
  lastVisitDate: string | null;
  totalVisits: number;
}

export interface MedicalCodeSearchResult {
  code: string;
  label: string;
  description: string | null;
  category: string | null;
  relevance: number;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  is_public: boolean;
}

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  department_id: string | null;
  department?: Department | null;
}

export interface MedicalStaff {
  id: string;
  user_id?: string;
  specialization: string | null;
  years_of_experience: number;
  consultation_fee: number | null;
  bio: string | null;
  license_number: string | null;
  is_accepting_patients: boolean;
  user_profile?: UserProfile | null;
}

export interface Patient {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  primary_care_physician_id: string | null;
  primary_care_physician?: {
    user_profile?: { full_name: string };
    specialization?: string;
    license_number?: string;
    consultation_fee?: number;
  } | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string | null;
  draft_number?: string | null;
  patient_id: string;
  patient?: Patient | null;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'cancelled';
  payment_method: string | null;
  payment_date: string | null;
  net_to_pay?: number;
  numero_recu?: string | null;
  devise_paiement?: 'USD' | 'CDF' | null;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  total?: number;
}

export interface PaymentHistory {
  id: string;
  payment_amount: number;
  payment_method: string | null;
  payment_date: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  name_en: string;
  name_ar: string;
  icon: string | null;
  is_active: boolean;
  display_order: number;
}

export interface Service {
  id: string;
  name: string;
  name_en: string;
  name_ar: string;
  description: string | null;
  description_en: string | null;
  description_ar: string | null;
  category_id: string;
  department_id: string | null;
  icon: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  telemedicine_available: boolean;
  estimated_duration_minutes: number;
  display_order: number;
}

export interface PostCategory {
  id: string;
  name: string;
  name_en?: string;
  name_ar?: string;
}

export interface Post {
  id: string;
  slug: string | null;
  title: string;
  title_en?: string;
  title_ar?: string;
  content: string;
  content_en?: string;
  content_ar?: string;
  excerpt: string | null;
  excerpt_en?: string;
  excerpt_ar?: string;
  featured_image_url: string | null;
  image_url: string | null;
  status: string;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  reading_time: number;
  view_count: number;
  tags: string[] | null;
  category_id: string | null;
  category?: PostCategory | null;
  author?: { id: string; full_name: string; avatar_url: string } | null;
}

export interface Appointment {
  id: string;
  appointment_number: string;
  patient_id?: string;
  patient?: Patient | null;
  doctor_id?: string;
  doctor?: { user_profile?: { full_name: string }; specialization?: string } | null;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reason: string | null;
  notes: string | null;
  special_requirements: string | null;
  estimated_duration: number | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  checked_in_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Prescription {
  id: string;
  prescription_number: string;
  patient_id: string;
  patient?: Patient | null;
  doctor_id: string;
  doctor?: { user_profile?: { full_name: string }; full_name?: string } | null;
  pharmacy_id: string | null;
  pharmacy?: { name: string } | null;
  prescription_date: string;
  expiration_date: string;
  status: 'pending' | 'dispensed' | 'expired' | 'cancelled';
  diagnosis: string | null;
  notes: string | null;
  qr_code: string | null;
  dispensed_at: string | null;
  items?: PrescriptionItem[];
  created_at: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_id: string;
  medication?: Medication | null;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string | null;
  substitution_allowed: boolean;
  stock_available: boolean;
  alternative_medication_id?: string;
}

export interface Medication {
  id: string;
  generic_name: string;
  brand_name: string | null;
  strength: string;
  is_active: boolean;
}

export interface Pharmacy {
  id: string;
  name: string;
  active: boolean;
}

export interface PharmacyStock {
  id: string;
  medication_id: string;
  pharmacy_id: string;
  quantity: number;
}

export interface StockAlert {
  id: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  medication?: { brand_name?: string; generic_name?: string } | null;
  pharmacy?: { name: string } | null;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface PatientINSIdentity {
  id: string;
  patient_id: string;
  ins_number: string | null;
  ins_c_matricule: string | null;
  oid: string | null;
  qualification_status: string;
  validation_date: string | null;
  validated_by: string | null;
  issuing_organization: string | null;
  issuing_organization_oid: string | null;
  verification_method: string | null;
  last_verification_date: string | null;
  verification_notes: string | null;
}

export interface PatientMedicalHistory {
  id: string;
  patient_id: string;
  condition_name: string;
  icd10_code: string | null;
  icd10_description: string | null;
  snomed_code: string | null;
  diagnosis_date: string | null;
  resolution_date: string | null;
  status: string;
  severity: string | null;
  clinical_notes: string | null;
  treatment_current: string | null;
  recorded_by_user?: { full_name: string } | null;
}

export interface PatientAllergyDetailed {
  id: string;
  patient_id: string;
  allergen_name: string;
  allergy_type: string;
  severity: string;
  status: string;
  reaction_description: string | null;
  first_occurrence_date: string | null;
  last_occurrence_date: string | null;
  clinical_notes: string | null;
  snomed_code: string | null;
  treatment_administered: string | null;
}

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  consultation_date: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  follow_up_date: string | null;
  doctor?: { user_profile?: { full_name: string }; specialization?: string } | null;
}

export interface WaitingQueue {
  id: string;
  checkin_id: string;
  patient_id: string;
  patient?: { first_name: string; last_name: string; patient_number: string } | null;
  physician_id: string | null;
  physician?: { full_name: string } | null;
  queue_number: string;
  queue_position: number | null;
  priority_level: number;
  estimated_wait_minutes: number;
  status: string;
}

export interface IntakeForm {
  id: string;
  checkin_id: string;
  patient_id: string;
  form_type: string;
  form_name: string;
  is_required: boolean;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
}

export interface ICD10Code {
  id: string;
  code: string;
  description_fr: string;
  category: string;
  subcategory: string | null;
  is_active: boolean;
}

export interface ConsultationTemplate {
  id: string;
  name: string;
  description: string | null;
  specialty: string;
  is_system_template: boolean;
  is_shared: boolean;
  created_by: string | null;
  usage_count: number;
  suggested_diagnoses: string[] | null;
}
