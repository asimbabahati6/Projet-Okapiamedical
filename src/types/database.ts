export interface Role {
  id: string;
  name: string;
  description: string | null;
  level: number;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  doctor_count?: number;
}

export interface DoctorDepartment {
  id: string;
  doctor_id: string;
  department_id: string;
  assigned_at: string;
  assigned_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: Department;
  doctor?: MedicalStaff & { user_profile?: UserProfile };
  assigned_by_user?: UserProfile;
}

export interface UserProfile {
  id: string;
  role_id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  phone: string | null;
  avatar_url: string | null;
  department_id: string | null;
  is_active: boolean;
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
  role?: Role;
  department?: Department;
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
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  primary_care_physician_id: string | null;
  profile_photo_url: string | null;
  created_at: string;
  updated_at: string;
  primary_care_physician?: MedicalStaff & { user_profile?: UserProfile };
}

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

export type StaffCategory = 'medical' | 'nursing' | 'technical' | 'therapy' | 'administrative' | 'pharmacy' | 'support' | 'other';

export interface MedicalStaff {
  id: string;
  license_number: string | null;
  specialization: string | null;
  qualifications: string[] | null;
  years_of_experience: number;
  consultation_fee: number | null;
  bio: string | null;
  is_accepting_patients: boolean;
  telemedicine_enabled: boolean;
  telemedicine_platforms: string[] | null;
  max_daily_appointments: number;
  buffer_time_minutes: number;
  average_rating: number | null;
  total_ratings: number;
  staff_type: StaffType;
  staff_category: StaffCategory;
  certifications_list: any;
  equipment_access: any;
  department_restrictions: any;
  shift_preferences: string | null;
  can_work_nights: boolean;
  can_work_weekends: boolean;
  requires_supervision: boolean;
  supervisor_id: string | null;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
  departments?: DoctorDepartment[];
  nurse_details?: StaffNurseDetails;
  technician_details?: StaffTechnicianDetails;
  therapist_details?: StaffTherapistDetails;
  administrative_details?: StaffAdministrativeDetails;
}

export interface StaffNurseDetails {
  id: string;
  staff_id: string;
  nurse_type: string;
  specialized_certifications: string[];
  ward_assignments: string[];
  can_administer_iv: boolean;
  can_handle_controlled_substances: boolean;
  can_perform_wound_care: boolean;
  can_perform_injections: boolean;
  emergency_care_certified: boolean;
  pediatric_care_certified: boolean;
  geriatric_care_certified: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffTechnicianDetails {
  id: string;
  staff_id: string;
  technician_type: string;
  equipment_certifications: string[];
  laboratory_sections: string[];
  imaging_modalities: string[];
  radiation_safety_certified: boolean;
  contrast_injection_certified: boolean;
  can_validate_results: boolean;
  equipment_maintenance_trained: boolean;
  quality_control_certified: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffTherapistDetails {
  id: string;
  staff_id: string;
  therapist_type: string;
  therapy_specializations: string[];
  treatment_methods: string[];
  home_visit_enabled: boolean;
  pediatric_therapy_certified: boolean;
  sports_therapy_certified: boolean;
  neurological_therapy_certified: boolean;
  manual_therapy_certified: boolean;
  equipment_list: string[];
  created_at: string;
  updated_at: string;
}

export interface StaffAdministrativeDetails {
  id: string;
  staff_id: string;
  admin_type: string;
  departments_assigned: string[];
  scheduling_permissions: boolean;
  billing_access: boolean;
  medical_records_access_level: string;
  can_register_patients: boolean;
  can_manage_appointments: boolean;
  can_handle_insurance: boolean;
  reception_desk_assigned: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffTypePermission {
  id: string;
  staff_type: StaffType;
  resource_type: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  restrictions: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffTypeInfo {
  staff_type: StaffType;
  category: StaffCategory;
  display_name: string;
}

export interface AppointmentSlot {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  max_appointments: number;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  appointment_number: string;
  patient_id: string;
  doctor_id: string;
  department_id: string | null;
  service_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  appointment_type: 'in-person' | 'telemedicine';
  reason: string | null;
  notes: string | null;
  telemedicine_notes: string | null;
  confirmation_code: string | null;
  qr_code_data: string | null;
  patient_preparation_notes: string | null;
  estimated_duration: number;
  special_requirements: string | null;
  preferred_language: string;
  routing_type: 'new_patient_to_reception' | 'existing_patient_to_pcp' | 'manual_override' | null;
  routing_notes: string | null;
  is_new_patient_appointment: boolean;
  checked_in_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: MedicalStaff & { user_profile?: UserProfile };
  department?: Department;
  service?: Service;
}

export interface PatientStatus {
  isNewPatient: boolean;
  primaryCarePhysicianId: string | null;
  lastVisitDate: string | null;
  totalVisits: number;
}

export interface Consultation {
  id: string;
  appointment_id: string | null;
  patient_id: string;
  doctor_id: string;
  consultation_date: string;
  consultation_number: string;
  consultation_status: 'draft' | 'in_progress' | 'completed' | 'reviewed' | 'archived';
  consultation_type: 'initial' | 'follow_up' | 'emergency' | 'routine' | 'telemedicine';
  chief_complaint: string | null;
  history_of_present_illness: string | null;
  vital_signs: {
    blood_pressure?: string;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    temperature?: string;
    heart_rate?: string;
    respiratory_rate?: string;
    weight?: string;
    height?: string;
  } | null;
  physical_examination: string | null;
  diagnosis: string | null;
  diagnosis_codes: string[] | null;
  treatment_plan: string | null;
  notes: string | null;
  follow_up_date: string | null;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploaded_at: string;
  }>;
  template_used_id: string | null;
  bmi: number | null;
  duration_minutes: number | null;
  is_locked: boolean;
  locked_by: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: MedicalStaff & { user_profile?: UserProfile };
  diagnoses?: ConsultationDiagnosis[];
  template?: ConsultationTemplate;
}

export interface ConsultationDiagnosis {
  id: string;
  consultation_id: string;
  icd10_code_id: string | null;
  icd10_code: string | null;
  icd10_description: string | null;
  free_text_diagnosis: string | null;
  is_primary: boolean;
  diagnosis_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  icd10?: ICD10Code;
}

export interface ICD10Code {
  id: string;
  code: string;
  description_fr: string;
  description_en: string | null;
  category: string;
  subcategory: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsultationTemplate {
  id: string;
  name: string;
  specialty: string;
  description: string | null;
  is_system_template: boolean;
  created_by: string | null;
  department_id: string | null;
  chief_complaint_template: string | null;
  history_template: string | null;
  examination_template: string | null;
  treatment_template: string | null;
  notes_template: string | null;
  vital_signs_defaults: Record<string, any>;
  suggested_diagnoses: Array<{
    code: string;
    description: string;
  }>;
  usage_count: number;
  last_used_at: string | null;
  is_shared: boolean;
  shared_with_department: string | null;
  version: number;
  parent_template_id: string | null;
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface ConsultationAuditLog {
  id: string;
  consultation_id: string;
  action: 'created' | 'updated' | 'status_changed' | 'viewed' | 'shared' | 'locked' | 'unlocked' | 'deleted';
  changed_fields: Record<string, any> | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  performed_by: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Prescription {
  id: string;
  consultation_id: string | null;
  patient_id: string;
  doctor_id: string;
  pharmacy_id: string | null;
  prescription_number: string;
  prescription_date: string;
  expiration_date: string;
  status: 'pending' | 'dispensed' | 'expired' | 'cancelled';
  diagnosis: string | null;
  notes: string | null;
  qr_code: string | null;
  digital_signature: string | null;
  dispensed_by: string | null;
  dispensed_at: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: MedicalStaff & { user_profile?: UserProfile };
  pharmacy?: Pharmacy;
  items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_id: string;
  dosage: string;
  quantity: number;
  frequency: string;
  duration: string;
  instructions: string | null;
  substitution_allowed: boolean;
  stock_available: boolean;
  alternative_medication_id: string | null;
  created_at: string;
  medication?: Medication;
  alternative_medication?: Medication;
}

export interface Pharmacy {
  id: string;
  name: string;
  license_number: string;
  address: string;
  city: string;
  phone: string;
  email: string | null;
  active: boolean;
  created_at: string;
}

export interface PharmacyStock {
  id: string;
  pharmacy_id: string;
  medication_id: string;
  quantity: number;
  reorder_level: number;
  expiry_date: string | null;
  batch_number: string | null;
  unit_price: number | null;
  last_updated: string;
  updated_by: string | null;
  pharmacy?: Pharmacy;
  medication?: Medication;
}

export interface StockAlert {
  id: string;
  pharmacy_id: string;
  medication_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'expired' | 'expiring_soon';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
  pharmacy?: Pharmacy;
  medication?: Medication;
}

export interface PrescriptionAuditLog {
  id: string;
  prescription_id: string;
  action: 'created' | 'viewed' | 'edited' | 'dispensed' | 'cancelled' | 'exported_pdf' | 'exported_excel';
  performed_by: string;
  performed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, any> | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  user?: UserProfile;
}

export interface LabTest {
  id: string;
  test_code: string;
  test_name: string;
  category: string | null;
  specimen_type: string | null;
  normal_range: string | null;
  unit: string | null;
  price: number | null;
  turnaround_time: number | null;
  is_active: boolean;
  created_at: string;
}

export interface LabOrder {
  id: string;
  order_number: string;
  patient_id: string;
  doctor_id: string;
  consultation_id: string | null;
  test_id: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'pending' | 'collected' | 'in_progress' | 'completed' | 'cancelled';
  specimen_collected_at: string | null;
  result_value: string | null;
  result_unit: string | null;
  is_abnormal: boolean;
  notes: string | null;
  performed_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  test?: LabTest;
}

export interface Ward {
  id: string;
  name: string;
  ward_type: string | null;
  floor: number | null;
  total_beds: number;
  available_beds: number;
  created_at: string;
}

export interface Bed {
  id: string;
  ward_id: string;
  bed_number: string;
  room_number: string | null;
  bed_type: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  current_patient_id: string | null;
  created_at: string;
  updated_at: string;
  ward?: Ward;
}

export interface Hospitalization {
  id: string;
  admission_number: string;
  patient_id: string;
  doctor_id: string;
  bed_id: string | null;
  admission_date: string;
  admission_reason: string | null;
  admission_diagnosis: string | null;
  status: 'active' | 'discharged' | 'transferred';
  discharge_date: string | null;
  discharge_summary: string | null;
  discharge_instructions: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: MedicalStaff & { user_profile?: UserProfile };
  bed?: Bed & { ward?: Ward };
}

export interface Medication {
  id: string;
  medication_code: string;
  generic_name: string;
  brand_name: string | null;
  category: string | null;
  dosage_form: string | null;
  strength: string | null;
  unit_price: number | null;
  quantity_in_stock: number;
  reorder_level: number;
  expiry_date: string | null;
  supplier: string | null;
  is_controlled_substance: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string | null;
  patient_id: string;
  consultation_id: string | null;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'cancelled';
  payment_method: string | null;
  payment_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  tva_rate?: number;
  tva_amount?: number;
  net_to_pay?: number;
  draft_number?: string | null;
  patient?: Patient;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  item_type: string | null;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  created_at: string;
}

export interface PaymentHistory {
  id: string;
  invoice_id: string;
  payment_amount: number;
  payment_method: string;
  payment_date: string;
  transaction_reference: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  recorded_by_user?: UserProfile;
}

export interface PostCategory {
  id: string;
  name: string;
  name_en: string | null;
  name_ar: string | null;
  description: string | null;
  description_en: string | null;
  description_ar: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  title_en: string | null;
  title_ar: string | null;
  content: string;
  content_en: string | null;
  content_ar: string | null;
  excerpt: string | null;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  image_url: string | null;
  featured_image_url: string | null;
  video_url: string | null;
  category_id: string | null;
  tags: string[];
  author_id: string | null;
  status: 'brouillon' | 'publié' | 'archivé';
  slug: string | null;
  view_count: number;
  reading_time: number;
  is_featured: boolean;
  meta_description: string | null;
  scheduled_publish_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: UserProfile;
  category?: PostCategory;
}

export interface PostMedia {
  id: string;
  post_id: string;
  media_type: 'image' | 'video' | 'embed';
  media_url: string;
  caption: string | null;
  caption_en: string | null;
  caption_ar: string | null;
  display_order: number;
  created_at: string;
}

export interface PostAuditLog {
  id: string;
  post_id: string;
  user_id: string | null;
  action: 'created' | 'updated' | 'deleted' | 'published' | 'archived';
  changes: Record<string, any> | null;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string | null;
  author_id: string | null;
  featured_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: UserProfile;
}

export interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  responded_by: string | null;
  response: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  parent_message_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  sender?: UserProfile;
  recipient?: UserProfile;
}

export interface ServiceCategory {
  id: string;
  name: string;
  name_en: string;
  name_ar: string;
  description: string | null;
  description_en: string | null;
  description_ar: string | null;
  icon: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  category_id: string | null;
  department_id: string | null;
  name: string;
  name_en: string;
  name_ar: string;
  description: string | null;
  description_en: string | null;
  description_ar: string | null;
  icon: string | null;
  image_url: string | null;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
  telemedicine_available: boolean;
  estimated_duration_minutes: number;
  preparation_instructions: string | null;
  preparation_instructions_en: string | null;
  preparation_instructions_ar: string | null;
  created_at: string;
  updated_at: string;
  category?: ServiceCategory;
  department?: Department;
}

export interface PatientCheckIn {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  checkin_time: string;
  checkin_type: 'scheduled_appointment' | 'walk_in' | 'emergency';
  is_new_patient: boolean;
  routing_decision: 'to_reception' | 'to_physician' | 'to_emergency';
  assigned_to: string | null;
  queue_number: string;
  status: 'checked_in' | 'in_registration' | 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
  reception_notes: string | null;
  intake_forms_completed: boolean;
  completed_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  appointment?: Appointment;
  assigned_to_user?: UserProfile;
  checked_in_by_user?: UserProfile;
}

export interface IntakeForm {
  id: string;
  checkin_id: string;
  patient_id: string;
  form_type: 'personal_info' | 'medical_history' | 'insurance' | 'consent' | 'emergency_contact';
  form_name: string;
  is_required: boolean;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_by_user?: UserProfile;
}

export interface WaitingQueue {
  id: string;
  checkin_id: string;
  patient_id: string;
  physician_id: string | null;
  queue_number: string;
  priority_level: 1 | 2 | 3;
  estimated_wait_minutes: number;
  queue_position: number | null;
  room_number: string | null;
  status: 'waiting' | 'called' | 'in_progress' | 'completed' | 'cancelled';
  joined_queue_at: string;
  called_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  physician?: UserProfile;
  checkin?: PatientCheckIn;
}

export interface PatientRegistration {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  primary_phone: string;
  secondary_phone: string | null;
  primary_email: string;
  backup_email: string | null;
  street_address: string;
  city: string;
  postal_code: string | null;
  country: string;
  profession: string | null;
  employer: string | null;
  consultation_reason: string;
  medical_history: string | null;
  known_allergies: string | null;
  chronic_conditions: string | null;
  current_medications: string | null;
  current_physician_name: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  preferred_consultation_type: 'in-person' | 'telemedicine' | 'either';
  preferred_days: string[] | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  preferred_doctor_id: string | null;
  preferred_department_id: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  registration_status: 'pending_verification' | 'documents_requested' | 'verified' | 'rejected' | 'completed';
  verification_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  payment_required: boolean;
  payment_amount: number | null;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  assigned_doctor_id: string | null;
  routing_type: 'to_reception' | 'to_physician' | 'to_emergency' | null;
  routing_notes: string | null;
  patient_id: string | null;
  appointment_id: string | null;
  submitted_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  identity_documents?: IdentityDocument[];
  payments?: RegistrationPayment[];
  assigned_doctor?: MedicalStaff & { user_profile?: UserProfile };
  verified_by_user?: UserProfile;
}

export interface IdentityDocument {
  id: string;
  registration_id: string;
  document_type: 'voter_card' | 'drivers_license' | 'passport' | 'service_card' | 'national_id';
  document_number: string;
  document_expiry_date: string | null;
  front_image_path: string;
  back_image_path: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | 'requires_resubmission';
  verification_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
  verified_by_user?: UserProfile;
}

export interface RegistrationPayment {
  id: string;
  registration_id: string;
  invoice_id: string | null;
  amount: number;
  payment_method: 'cash' | 'card' | 'mobile_money' | 'insurance' | 'bank_transfer';
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transaction_reference: string | null;
  payment_date: string | null;
  receipt_number: string | null;
  receipt_url: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  recorded_by_user?: UserProfile;
}

export interface RegistrationVerificationHistory {
  id: string;
  registration_id: string;
  action_type: 'submitted' | 'documents_requested' | 'verified' | 'rejected' | 'payment_completed' | 'assigned_doctor' | 'completed';
  previous_status: string | null;
  new_status: string | null;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
  performed_by_user?: UserProfile;
}

export interface PatientINSIdentity {
  id: string;
  patient_id: string;
  ins_number: string | null;
  ins_c_matricule: string | null;
  oid: string | null;
  qualification_status: 'qualifié' | 'provisoire' | 'non_qualifié' | 'en_cours_validation';
  validation_date: string | null;
  validated_by: string | null;
  issuing_organization: string | null;
  issuing_organization_oid: string | null;
  verification_method: string | null;
  verification_notes: string | null;
  last_verification_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  metadata_fhir: Record<string, any>;
  created_by_user?: UserProfile;
}

export interface PatientMedicalHistory {
  id: string;
  patient_id: string;
  condition_name: string;
  condition_name_en: string | null;
  icd10_code: string | null;
  icd10_description: string | null;
  snomed_code: string | null;
  snomed_description: string | null;
  diagnosis_date: string | null;
  resolution_date: string | null;
  status: 'actif' | 'résolu' | 'rémission' | 'chronique' | 'récurrent';
  severity: 'léger' | 'modéré' | 'sévère' | 'critique' | null;
  clinical_notes: string | null;
  treatment_current: string | null;
  recorded_by: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
  metadata_fhir: Record<string, any>;
  recorded_by_user?: UserProfile;
  verified_by_user?: UserProfile;
}

export interface PatientFamilyHistory {
  id: string;
  patient_id: string;
  relationship: 'père' | 'mère' | 'frère' | 'soeur' | 'fils' | 'fille' | 'grand-père_paternel' | 'grand-mère_paternelle' | 'grand-père_maternel' | 'grand-mère_maternelle' | 'oncle' | 'tante' | 'cousin' | 'cousine' | 'autre';
  relationship_notes: string | null;
  condition_name: string;
  condition_name_en: string | null;
  icd10_code: string | null;
  icd10_description: string | null;
  snomed_code: string | null;
  age_at_onset: number | null;
  age_at_death: number | null;
  cause_of_death: string | null;
  severity: 'léger' | 'modéré' | 'sévère' | 'fatal' | null;
  clinical_notes: string | null;
  genetic_testing_performed: boolean;
  genetic_testing_results: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  metadata_fhir: Record<string, any>;
  recorded_by_user?: UserProfile;
}

export interface PatientAllergyDetailed {
  id: string;
  patient_id: string;
  allergen_name: string;
  allergen_name_en: string | null;
  allergy_type: 'médicament' | 'aliment' | 'environnement' | 'insecte' | 'latex' | 'autre';
  snomed_code: string | null;
  snomed_description: string | null;
  severity: 'légère' | 'modérée' | 'sévère' | 'anaphylaxie';
  reaction_type: string | null;
  reaction_description: string | null;
  first_occurrence_date: string | null;
  last_occurrence_date: string | null;
  status: 'actif' | 'résolu' | 'suspecté' | 'confirmé';
  clinical_notes: string | null;
  treatment_administered: string | null;
  recorded_by: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
  metadata_fhir: Record<string, any>;
  recorded_by_user?: UserProfile;
  verified_by_user?: UserProfile;
}

export interface PatientRiskFactor {
  id: string;
  patient_id: string;
  risk_factor_name: string;
  risk_factor_name_en: string | null;
  category: 'cardiovasculaire' | 'métabolique' | 'comportemental' | 'environnemental' | 'génétique' | 'infectieux' | 'autre';
  snomed_code: string | null;
  loinc_code: string | null;
  risk_level: 'faible' | 'modéré' | 'élevé' | 'très_élevé';
  quantitative_value: number | null;
  quantitative_unit: string | null;
  reference_range: string | null;
  identified_date: string;
  reassessment_date: string | null;
  status: 'actif' | 'contrôlé' | 'résolu';
  intervention_plan: string | null;
  monitoring_frequency: string | null;
  clinical_notes: string | null;
  identified_by: string | null;
  created_at: string;
  updated_at: string;
  metadata_fhir: Record<string, any>;
  identified_by_user?: UserProfile;
}

export interface PatientConsent {
  id: string;
  patient_id: string;
  consent_type: 'soins_généraux' | 'soins_spécifiques' | 'recherche_clinique' | 'partage_données' | 'télémédecine' | 'photographie_médicale' | 'enseignement' | 'don_organes' | 'transfusion' | 'anesthésie' | 'autre';
  consent_name: string;
  consent_description: string | null;
  status: 'actif' | 'révoqué' | 'expiré' | 'en_attente';
  signature_date: string | null;
  effective_date: string;
  expiration_date: string | null;
  revocation_date: string | null;
  signed_by_patient: boolean;
  patient_signature_method: 'électronique' | 'manuscrite' | 'verbale' | 'représentant_légal' | null;
  legal_representative_name: string | null;
  legal_representative_relationship: string | null;
  witness_name: string | null;
  witness_signature_date: string | null;
  document_reference: string | null;
  document_version: string | null;
  document_url: string | null;
  notes: string | null;
  revocation_reason: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  metadata_fhir: Record<string, any>;
  recorded_by_user?: UserProfile;
}

export interface PatientAdvanceDirective {
  id: string;
  patient_id: string;
  directive_type: 'limitation_soins' | 'refus_traitement' | 'personne_confiance' | 'don_organes' | 'soins_palliatifs' | 'réanimation' | 'autre';
  directive_name: string;
  directive_content: string;
  establishment_date: string;
  validity_start_date: string;
  validity_end_date: string | null;
  last_review_date: string | null;
  status: 'actif' | 'révoqué' | 'suspendu' | 'expiré';
  is_valid: boolean;
  trusted_person_name: string | null;
  trusted_person_relationship: string | null;
  trusted_person_phone: string | null;
  trusted_person_email: string | null;
  witness_name: string | null;
  witness_relationship: string | null;
  witness_signature_date: string | null;
  document_reference: string | null;
  document_url: string | null;
  document_stored_location: string | null;
  clinical_context: string | null;
  revision_notes: string | null;
  established_by: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  metadata_fhir: Record<string, any>;
  established_by_user?: UserProfile;
  reviewed_by_user?: UserProfile;
}

export interface PatientHospitalizationHistory {
  id: string;
  patient_id: string;
  admission_number: string;
  hospitalization_id: string | null;
  admission_date: string;
  discharge_date: string | null;
  total_stay_days: number | null;
  admitting_service: string;
  department_id: string | null;
  bed_location: string | null;
  ward_name: string | null;
  principal_diagnosis: string;
  principal_diagnosis_icd10: string | null;
  associated_diagnoses: string[] | null;
  associated_diagnoses_icd10: string[] | null;
  drg_code: string | null;
  drg_description: string | null;
  severity_level: number | null;
  attending_physician_id: string | null;
  referring_physician_id: string | null;
  admission_type: 'urgence' | 'programmée' | 'transfert' | 'ambulatoire';
  admission_reason: string | null;
  discharge_type: 'domicile' | 'transfert' | 'décès' | 'contre_avis_médical' | 'évasion' | 'autre' | null;
  discharge_destination: string | null;
  admission_summary: string | null;
  clinical_course_summary: string | null;
  discharge_summary: string | null;
  discharge_instructions: string | null;
  procedures_performed: string[] | null;
  procedures_ccam_codes: string[] | null;
  complications: string | null;
  adverse_events: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  metadata_fhir: Record<string, any>;
  department?: Department;
  attending_physician?: MedicalStaff & { user_profile?: UserProfile };
  referring_physician?: MedicalStaff & { user_profile?: UserProfile };
  recorded_by_user?: UserProfile;
}

export interface MedicalCodeICD10 {
  id: string;
  code: string;
  code_version: string;
  label_fr: string;
  label_en: string | null;
  short_label_fr: string | null;
  short_label_en: string | null;
  chapter: string | null;
  chapter_name: string | null;
  category: string | null;
  subcategory: string | null;
  description_fr: string | null;
  description_en: string | null;
  clinical_notes: string | null;
  synonyms: string[] | null;
  related_terms: string[] | null;
  is_active: boolean;
  deprecated_date: string | null;
  replacement_code: string | null;
  usage_count: number;
  last_used_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalCodeCCAM {
  id: string;
  code: string;
  code_version: string;
  label_fr: string;
  label_en: string | null;
  chapter: string | null;
  chapter_name: string | null;
  section: string | null;
  section_name: string | null;
  description_fr: string | null;
  description_en: string | null;
  technical_details: string | null;
  base_tariff: number | null;
  currency: string;
  reimbursement_rate: number | null;
  average_duration_minutes: number | null;
  anesthesia_required: boolean;
  hospitalization_required: boolean;
  specialty: string | null;
  medical_discipline: string | null;
  synonyms: string[] | null;
  related_codes: string[] | null;
  is_active: boolean;
  deprecated_date: string | null;
  usage_count: number;
  last_used_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalCodeLOINC {
  id: string;
  loinc_code: string;
  loinc_version: string;
  component: string;
  component_fr: string | null;
  property: string | null;
  time_aspect: string | null;
  system: string | null;
  scale_type: string | null;
  method_type: string | null;
  long_common_name: string;
  short_name: string | null;
  french_name: string | null;
  class_type: string | null;
  class_name: string | null;
  example_units: string | null;
  reference_range_adult: string | null;
  reference_range_child: string | null;
  reference_range_male: string | null;
  reference_range_female: string | null;
  description: string | null;
  clinical_information: string | null;
  synonyms: string[] | null;
  related_codes: string[] | null;
  is_active: boolean;
  status: string | null;
  usage_count: number;
  last_used_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalCodeSNOMED {
  id: string;
  concept_id: string;
  concept_version: string;
  fully_specified_name: string;
  preferred_term: string;
  french_term: string | null;
  semantic_tag: string | null;
  parent_concepts: string[] | null;
  child_concepts: string[] | null;
  hierarchy: string | null;
  domain: string | null;
  descriptions: string[] | null;
  synonyms: string[] | null;
  related_concepts: string[] | null;
  is_active: boolean;
  effective_date: string | null;
  usage_count: number;
  last_used_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientDataAccessLog {
  id: string;
  patient_id: string;
  user_id: string;
  access_type: 'view' | 'search' | 'export' | 'print' | 'api_access' | 'bulk_access';
  accessed_sections: string[] | null;
  access_reason: string | null;
  access_context: string | null;
  data_accessed: Record<string, any> | null;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_info: Record<string, any> | null;
  access_duration_seconds: number | null;
  access_location: string | null;
  patient_consent_verified: boolean;
  consent_id: string | null;
  is_suspicious: boolean;
  suspicious_reason: string | null;
  accessed_at: string;
  metadata: Record<string, any>;
  patient?: Patient;
  user?: UserProfile;
}

export interface PatientDataModificationLog {
  id: string;
  patient_id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  changed_fields: string[] | null;
  modification_reason: string | null;
  modification_context: string | null;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  requires_validation: boolean;
  validated_by: string | null;
  validated_at: string | null;
  modified_at: string;
  metadata: Record<string, any>;
  patient?: Patient;
  user?: UserProfile;
  validator?: UserProfile;
}

export interface PatientConsentHistory {
  id: string;
  consent_id: string;
  patient_id: string;
  action_type: 'created' | 'updated' | 'signed' | 'revoked' | 'expired' | 'renewed';
  action_details: string | null;
  previous_status: string | null;
  new_status: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  performed_by: string | null;
  ip_address: string | null;
  user_agent: string | null;
  signature_method: string | null;
  signature_data: string | null;
  performed_at: string;
  metadata: Record<string, any>;
  consent?: PatientConsent;
  patient?: Patient;
  performed_by_user?: UserProfile;
}

export interface MedicalCodeSearchResult {
  code: string;
  label: string;
  description: string | null;
  category: string | null;
  relevance: number;
}

export type VehicleType = 'ambulance_urgence' | 'ambulance_standard' | 'voiture_service' | 'camionnette' | 'moto';
export type VehicleStatus = 'disponible' | 'en_mission' | 'en_maintenance' | 'hors_service' | 'retire';
export type DriverLicenseType = 'permis_b' | 'permis_d' | 'permis_ambulance' | 'permis_moto';
export type MissionType = 'urgence' | 'transport_patient' | 'transfert_inter_hopital' | 'transport_materiel' | 'livraison_pharmacie' | 'autre';
export type MissionPriority = 'urgente' | 'elevee' | 'normale' | 'faible';
export type MissionStatus = 'planifiee' | 'en_attente' | 'en_cours' | 'completee' | 'annulee' | 'reportee';
export type FuelType = 'essence_95' | 'essence_98' | 'diesel' | 'electrique' | 'hybride';
export type MaintenanceType = 'vidange' | 'revision' | 'pneus' | 'freins' | 'controle_technique' | 'climatisation' | 'batterie' | 'autre';

export interface Vehicle {
  id: string;
  vehicle_number: string;
  registration_number?: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  year: number;
  registration_plate: string;
  vin_number: string | null;
  status: VehicleStatus;
  capacity_persons: number | null;
  capacity_weight_kg: number | null;
  purchase_date: string | null;
  purchase_price: number | null;
  current_mileage_km: number;
  last_service_date: string | null;
  next_service_due_km: number | null;
  insurance_policy_number: string | null;
  insurance_expiry_date: string | null;
  registration_expiry_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  user_id: string | null;
  employee_number: string;
  first_name: string;
  last_name: string;
  license_number: string;
  license_type: DriverLicenseType;
  license_expiry_date: string;
  medical_certificate_expiry_date: string | null;
  phone_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_available: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportMission {
  id: string;
  mission_number: string;
  mission_type: MissionType;
  priority: MissionPriority;
  status: MissionStatus;
  vehicle_id: string | null;
  driver_id: string | null;
  patient_id: string | null;
  pickup_location: string;
  pickup_address: string | null;
  pickup_coordinates: any | null;
  destination_location: string;
  destination_address: string | null;
  destination_coordinates: any | null;
  scheduled_departure: string | null;
  actual_departure: string | null;
  scheduled_arrival: string | null;
  actual_arrival: string | null;
  distance_km: number | null;
  description: string | null;
  special_requirements: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface VehicleLocation {
  id: string;
  vehicle_id: string;
  mission_id: string | null;
  location: any;
  address: string | null;
  speed_kmh: number | null;
  heading: number | null;
  altitude_m: number | null;
  accuracy_m: number | null;
  recorded_at: string;
  created_at: string;
}

export interface FuelRecord {
  id: string;
  vehicle_id: string;
  driver_id: string | null;
  fuel_type: FuelType;
  quantity_liters: number;
  cost_per_liter: number | null;
  total_cost: number | null;
  mileage_km: number;
  station_name: string | null;
  station_location: string | null;
  is_full_tank: boolean;
  receipt_number: string | null;
  notes: string | null;
  recorded_by: string | null;
  refuel_date: string;
  created_at: string;
}

export interface MaintenanceSchedule {
  id: string;
  vehicle_id: string;
  maintenance_type: MaintenanceType;
  description: string;
  scheduled_date: string | null;
  scheduled_mileage_km: number | null;
  interval_days: number | null;
  interval_km: number | null;
  last_performed_date: string | null;
  last_performed_mileage_km: number | null;
  next_due_date: string | null;
  next_due_mileage_km: number | null;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  schedule_id: string | null;
  maintenance_type: MaintenanceType;
  description: string;
  maintenance_date: string;
  mileage_km: number;
  service_provider: string | null;
  labor_cost: number | null;
  parts_cost: number | null;
  total_cost: number | null;
  invoice_number: string | null;
  warranty_expiry_date: string | null;
  performed_by: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export type MailType = 'entrant' | 'sortant';
export type MailPriority = 'normale' | 'elevee' | 'urgente' | 'critique';
export type MailStatus = 'recu' | 'en_attente' | 'en_cours' | 'traite' | 'archive' | 'annule';
export type MailFormat = 'papier' | 'email' | 'fax' | 'courrier_electronique' | 'recommande' | 'chronopost';
export type AssignmentStatus = 'attribue' | 'accepte' | 'en_cours' | 'termine' | 'refuse';
export type ApprovalDecision = 'en_attente' | 'approuve' | 'rejete' | 'delegue';
export type TrackingEventType = 'creation' | 'attribution' | 'lecture' | 'reponse' | 'validation' | 'archivage' | 'modification' | 'commentaire';

export interface MailCategory {
  id: string;
  name: string;
  description: string | null;
  parent_category_id: string | null;
  color_code: string;
  icon: string | null;
  default_priority: MailPriority;
  requires_approval: boolean;
  retention_years: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MailItem {
  id: string;
  reference: string;
  mail_type: MailType;
  category_id: string | null;
  subject: string;
  description: string | null;
  sender_name: string | null;
  sender_organization: string | null;
  sender_address: string | null;
  sender_email: string | null;
  sender_phone: string | null;
  recipient_name: string | null;
  recipient_organization: string | null;
  recipient_address: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  mail_date: string;
  received_date: string | null;
  sent_date: string | null;
  deadline_date: string | null;
  priority: MailPriority;
  status: MailStatus;
  format: MailFormat;
  external_reference: string | null;
  reply_to_mail_id: string | null;
  tracking_number: string | null;
  page_count: number | null;
  has_attachments: boolean;
  is_confidential: boolean;
  requires_response: boolean;
  response_deadline: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  archive_location: string | null;
  keywords: string[] | null;
  tags: string[] | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MailAttachment {
  id: string;
  mail_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string | null;
  checksum: string | null;
  description: string | null;
  is_original: boolean;
  page_count: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface MailAssignment {
  id: string;
  mail_id: string;
  assigned_to: string;
  assigned_by: string | null;
  assignment_status: AssignmentStatus;
  role: string | null;
  is_primary_responsible: boolean;
  instructions: string | null;
  assigned_at: string;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface MailResponse {
  id: string;
  mail_id: string;
  parent_response_id: string | null;
  response_type: string;
  content: string;
  is_internal: boolean;
  is_draft: boolean;
  attachments: any;
  mentions: string[] | null;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export interface MailTracking {
  id: string;
  mail_id: string;
  event_type: TrackingEventType;
  event_description: string | null;
  old_status: MailStatus | null;
  new_status: MailStatus | null;
  location: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  performed_by: string | null;
  performed_at: string;
}

export interface MailApprovalWorkflow {
  id: string;
  mail_id: string;
  workflow_name: string;
  description: string | null;
  is_sequential: boolean;
  current_step: number;
  total_steps: number;
  status: ApprovalDecision;
  started_at: string;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MailApprovalStep {
  id: string;
  workflow_id: string;
  step_number: number;
  approver_id: string;
  delegate_id: string | null;
  decision: ApprovalDecision;
  comments: string | null;
  decided_at: string | null;
  sla_hours: number | null;
  created_at: string;
}

export interface MailArchive {
  id: string;
  mail_id: string;
  archive_reference: string;
  archive_date: string;
  archive_location: string;
  box_number: string | null;
  shelf_reference: string | null;
  destruction_date: string | null;
  retention_period_years: number;
  legal_hold: boolean;
  notes: string | null;
  archived_by: string | null;
  created_at: string;
}

export interface MailTemplate {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  subject_template: string;
  body_template: string;
  variables: any;
  format: MailFormat;
  is_active: boolean;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// STAFF MANAGEMENT SYSTEM TYPES
// =====================================================

export type StaffAuditAction =
  | 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated'
  | 'license_updated' | 'insurance_updated' | 'credentials_verified'
  | 'profile_approved' | 'profile_rejected' | 'update_requested'
  | 'rolled_back' | 'recovered';

export type ApprovalType =
  | 'new_registration' | 'profile_update' | 'credential_change'
  | 'license_renewal' | 'department_assignment';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type CredentialType = 'rpps' | 'adeli' | 'license' | 'insurance' | 'certificate' | 'degree';

export type CredentialVerificationStatus = 'pending' | 'verified' | 'expired' | 'invalid' | 'suspended';

export type EmploymentEventType =
  | 'hired' | 'promoted' | 'transferred' | 'suspended'
  | 'terminated' | 'resigned' | 'retired';

export type DeletionType = 'resigned' | 'terminated' | 'retired' | 'transferred' | 'deceased';

export type DeletionApprovalStatus =
  | 'pending_hr' | 'pending_admin' | 'pending_final' | 'approved' | 'rejected';

export type ArchiveRetentionCategory = 'medical_personnel' | 'terminated_cause' | 'legal_hold' | 'standard';

export interface StaffAuditTrail {
  id: string;
  staff_id: string | null;
  action: StaffAuditAction;
  performed_by: string;
  performed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  changes_summary: string | null;
  approval_status: 'pending' | 'approved' | 'rejected' | null;
  approval_notes: string | null;
  created_at: string;
  performed_by_user?: UserProfile;
  staff?: MedicalStaff & { user_profile?: UserProfile };
}

export interface StaffPendingApproval {
  id: string;
  staff_id: string;
  approval_type: ApprovalType;
  requested_by: string;
  requested_at: string;
  status: ApprovalStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  data_payload: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  requested_by_user?: UserProfile;
  reviewed_by_user?: UserProfile;
  staff?: MedicalStaff & { user_profile?: UserProfile };
}

export interface StaffCredentialsVerification {
  id: string;
  staff_id: string;
  credential_type: CredentialType;
  credential_number: string;
  issuing_authority: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  verification_status: CredentialVerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  verification_method: string | null;
  document_url: string | null;
  notes: string | null;
  next_verification_date: string | null;
  auto_reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
  staff?: MedicalStaff & { user_profile?: UserProfile };
  verified_by_user?: UserProfile;
}

export interface StaffEmploymentHistory {
  id: string;
  staff_id: string;
  event_type: EmploymentEventType;
  event_date: string;
  effective_date: string;
  previous_position: string | null;
  new_position: string | null;
  previous_department_id: string | null;
  new_department_id: string | null;
  reason: string | null;
  processed_by: string | null;
  documentation_url: string | null;
  notes: string | null;
  created_at: string;
  staff?: MedicalStaff & { user_profile?: UserProfile };
  previous_department?: Department;
  new_department?: Department;
  processed_by_user?: UserProfile;
}

export interface StaffVersion {
  id: string;
  staff_id: string;
  version_number: number;
  data_snapshot: Record<string, any>;
  created_by: string;
  created_at: string;
  is_current: boolean;
  change_description: string | null;
  rollback_reason: string | null;
  staff?: MedicalStaff & { user_profile?: UserProfile };
  created_by_user?: UserProfile;
}

export interface StaffDeletionApproval {
  id: string;
  staff_id: string;
  deletion_type: string;
  deletion_reason: string;
  final_work_date: string;
  requested_by: string;
  requested_at: string;
  hr_approved_by: string | null;
  hr_approved_at: string | null;
  hr_comments: string | null;
  admin_approved_by: string | null;
  admin_approved_at: string | null;
  admin_comments: string | null;
  final_approved_by: string | null;
  final_approved_at: string | null;
  final_comments: string | null;
  approval_status: DeletionApprovalStatus;
  active_patients_count: number | null;
  future_appointments_count: number | null;
  on_call_schedules_count: number | null;
  patient_reassignment_plan: Record<string, any> | null;
  appointment_handling_plan: Record<string, any> | null;
  notifications_sent: any;
  created_at: string;
  updated_at: string;
  staff?: MedicalStaff & { user_profile?: UserProfile };
  requested_by_user?: UserProfile;
  hr_approved_by_user?: UserProfile;
  admin_approved_by_user?: UserProfile;
  final_approved_by_user?: UserProfile;
}

export interface StaffPermanentArchive {
  id: string;
  staff_id: string;
  complete_data: Record<string, any>;
  medical_staff_data: Record<string, any> | null;
  user_profile_data: Record<string, any> | null;
  detail_tables_data: Record<string, any> | null;
  employment_history: Record<string, any> | null;
  audit_trail_summary: Record<string, any> | null;
  archived_by: string | null;
  archive_reason: string;
  archive_date: string;
  retention_category: ArchiveRetentionCategory | null;
  legal_hold: boolean;
  destruction_date: string | null;
  destruction_approved_by: string | null;
  destroyed_at: string | null;
  encryption_key_id: string | null;
  checksum: string;
  created_at: string;
  archived_by_user?: UserProfile;
  destruction_approved_by_user?: UserProfile;
}

export interface StaffAuditTrailPermanent {
  id: string;
  staff_id: string;
  action: string;
  performed_by: string;
  performed_at: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  changes_summary: string | null;
  ip_address: string | null;
  session_id: string | null;
  created_at: string;
  performed_by_user?: UserProfile;
}

export interface SensitiveDataAccessLog {
  id: string;
  table_name: string;
  record_id: string;
  field_name: string;
  accessed_by: string;
  access_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  ip_address: string | null;
  created_at: string;
  accessed_by_user?: UserProfile;
}

// Extended MedicalStaff interface with deletion fields
export interface MedicalStaffExtended extends MedicalStaff {
  deleted_at: string | null;
  deleted_by: string | null;
  deletion_reason: string | null;
  deletion_type: DeletionType | null;
  final_work_date: string | null;
  archive_retention_years: number;
}

export interface PrescriptionExportData extends Prescription {
  items: PrescriptionItem[];
}

export interface Database {
  public: {
    Tables: {
      vehicles: { Row: Vehicle };
      drivers: { Row: Driver };
      transport_missions: { Row: TransportMission };
      vehicle_locations: { Row: VehicleLocation };
      fuel_records: { Row: FuelRecord };
      maintenance_schedules: { Row: MaintenanceSchedule };
      maintenance_records: { Row: MaintenanceRecord };
      mail_categories: { Row: MailCategory };
      mail_items: { Row: MailItem };
      mail_attachments: { Row: MailAttachment };
      mail_assignments: { Row: MailAssignment };
      mail_responses: { Row: MailResponse };
      mail_tracking: { Row: MailTracking };
      mail_approval_workflows: { Row: MailApprovalWorkflow };
      mail_approval_steps: { Row: MailApprovalStep };
      mail_archive: { Row: MailArchive };
      mail_templates: { Row: MailTemplate };
      staff_audit_trail: { Row: StaffAuditTrail };
      staff_pending_approvals: { Row: StaffPendingApproval };
      staff_credentials_verification: { Row: StaffCredentialsVerification };
      staff_employment_history: { Row: StaffEmploymentHistory };
      staff_versions: { Row: StaffVersion };
      staff_deletion_approvals: { Row: StaffDeletionApproval };
      staff_permanent_archive: { Row: StaffPermanentArchive };
      staff_audit_trail_permanent: { Row: StaffAuditTrailPermanent };
      sensitive_data_access_log: { Row: SensitiveDataAccessLog };
    };
  };
}
