export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  HOSPITAL_ADMIN = 'hospital_admin',
  MEDICAL_DIRECTOR = 'medical_director',
  ADMINISTRATIVE_DIRECTOR = 'administrative_director',
  HR_MANAGER = 'hr_manager',
  FINANCE_MANAGER = 'finance_manager',
  OPERATIONS_MANAGER = 'operations_manager',
  INFORMATION_SYSTEMS_COORDINATOR = 'information_systems_coordinator',
  DOCTOR = 'doctor',
  DENTIST = 'dentist',
  PHYSICAL_THERAPIST = 'physical_therapist',
  NURSE = 'nurse',
  PHARMACIST = 'pharmacist',
  ADMINISTRATIVE_STAFF = 'administrative_staff',
  ADMINISTRATIVE_OFFICER = 'administrative_officer',
  ADMINISTRATIVE_ASSISTANT = 'administrative_assistant',
  RECEPTIONIST = 'receptionist',
  LAB_TECHNICIAN = 'lab_technician',
  LOGISTICIAN = 'logistician',
  PATIENT = 'patient',
  DIRECTEUR_GENERAL = 'directeur_general',
  MEDECIN_CHEF_STAFF = 'medecin_chef_staff',
  GESTIONNAIRE = 'gestionnaire',
  RADIO_CHEF = 'radio_chef',
  RADIO_TECH = 'radio_tech',
  CAISSIERE = 'caissiere',
  TECHNIQUE = 'technique',
  HYGIENE = 'hygiene'
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  NO_SHOW = 'no_show'
}

export enum LabOrderStatus {
  PRESCRIBED = 'prescribed',
  PENDING_SAMPLE = 'pending_sample',
  SAMPLE_RECEIVED = 'sample_received',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VALIDATED = 'validated',
  RESULTS_SENT = 'results_sent',
  VIEWED = 'viewed'
}

export enum PrescriptionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum NotificationType {
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  LAB_ORDER_CREATED = 'lab_order_created',
  LAB_RESULTS_READY = 'lab_results_ready',
  PRESCRIPTION_CREATED = 'prescription_created',
  PRESCRIPTION_DISPENSED = 'prescription_dispensed',
  PAYMENT_DUE = 'payment_due',
  PAYMENT_RECEIVED = 'payment_received',
  SYSTEM_ALERT = 'system_alert'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum ConsultationType {
  IN_PERSON = 'in_person',
  TELEMEDICINE = 'telemedicine',
  EMERGENCY = 'emergency',
  FOLLOW_UP = 'follow_up'
}

export enum SlotDuration {
  FIFTEEN_MIN = 15,
  THIRTY_MIN = 30,
  SIXTY_MIN = 60
}

export enum FacilityType {
  HOSPITAL = 'hospital',
  CLINIC = 'clinic',
  LABORATORY = 'laboratory',
  PHARMACY = 'pharmacy'
}
