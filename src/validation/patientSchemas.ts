import { z } from 'zod';

const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const personalInfoSchema = z.object({
  first_name: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le prénom ne peut contenir que des lettres'),
  last_name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom ne peut contenir que des lettres'),
  date_of_birth: z.string()
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 0 && age <= 150;
    }, 'Date de naissance invalide'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Veuillez sélectionner un sexe' })
  }),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''], {
    errorMap: () => ({ message: 'Groupe sanguin invalide' })
  }).optional(),
  profile_photo_url: z.string().url().optional().nullable(),
});

export const contactInfoSchema = z.object({
  phone: z.string()
    .min(8, 'Le numéro de téléphone doit contenir au moins 8 chiffres')
    .regex(phoneRegex, 'Format de téléphone invalide'),
  email: z.string()
    .email('Format email invalide')
    .regex(emailRegex, 'Format email invalide'),
  address: z.string()
    .min(5, 'L\'adresse doit contenir au moins 5 caractères')
    .max(200, 'L\'adresse ne peut pas dépasser 200 caractères'),
  city: z.string()
    .min(2, 'La ville doit contenir au moins 2 caractères')
    .max(100, 'La ville ne peut pas dépasser 100 caractères'),
  postal_code: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

export const medicalHistorySchema = z.object({
  allergies: z.array(z.object({
    name: z.string().min(2, 'Le nom de l\'allergie doit contenir au moins 2 caractères'),
    severity: z.enum(['mild', 'moderate', 'severe', 'critical'], {
      errorMap: () => ({ message: 'Niveau de criticité invalide' })
    }),
    reaction: z.string().optional(),
  })).optional().default([]),
  chronic_conditions: z.array(z.object({
    name: z.string().min(2, 'Le nom de la maladie doit contenir au moins 2 caractères'),
    diagnosis_date: z.string().optional(),
    notes: z.string().optional(),
  })).optional().default([]),
  past_surgeries: z.array(z.object({
    name: z.string().min(2, 'Le nom de l\'intervention doit contenir au moins 2 caractères'),
    date: z.string().optional(),
    hospital: z.string().optional(),
    notes: z.string().optional(),
  })).optional().default([]),
  family_history: z.string().optional().nullable(),
  current_medications: z.string().optional().nullable(),
});

export const emergencyContactSchema = z.object({
  emergency_contact_name: z.string()
    .min(2, 'Le nom du contact doit contenir au moins 2 caractères')
    .max(100, 'Le nom du contact ne peut pas dépasser 100 caractères'),
  emergency_contact_phone: z.string()
    .regex(phoneRegex, 'Format de téléphone invalide'),
  emergency_contact_relationship: z.string()
    .min(2, 'La relation doit contenir au moins 2 caractères')
    .max(50, 'La relation ne peut pas dépasser 50 caractères'),
});

export const insuranceInfoSchema = z.object({
  insurance_provider: z.string().optional().nullable(),
  insurance_number: z.string().optional().nullable(),
  primary_care_physician_id: z.string().uuid().optional().nullable(),
});

export const vitalSignsSchema = z.object({
  systolic_bp: z.number()
    .min(60, 'Pression systolique trop basse')
    .max(250, 'Pression systolique trop élevée')
    .optional(),
  diastolic_bp: z.number()
    .min(40, 'Pression diastolique trop basse')
    .max(150, 'Pression diastolique trop élevée')
    .optional(),
  heart_rate: z.number()
    .min(30, 'Fréquence cardiaque trop basse')
    .max(220, 'Fréquence cardiaque trop élevée')
    .optional(),
  temperature: z.number()
    .min(35, 'Température trop basse')
    .max(43, 'Température trop élevée')
    .optional(),
  weight: z.number()
    .min(1, 'Poids invalide')
    .max(500, 'Poids invalide')
    .optional(),
  height: z.number()
    .min(30, 'Taille invalide')
    .max(300, 'Taille invalide')
    .optional(),
  oxygen_saturation: z.number()
    .min(0, 'Saturation invalide')
    .max(100, 'Saturation invalide')
    .optional(),
  recorded_at: z.string(),
  recorded_by: z.string().uuid().optional(),
  notes: z.string().optional().nullable(),
});

export const prescriptionItemSchema = z.object({
  medication_name: z.string()
    .min(2, 'Le nom du médicament doit contenir au moins 2 caractères'),
  dosage: z.string()
    .min(1, 'Le dosage est requis'),
  frequency: z.string()
    .min(1, 'La fréquence est requise'),
  duration: z.string()
    .min(1, 'La durée est requise'),
  instructions: z.string().optional().nullable(),
  warnings: z.string().optional().nullable(),
});

export const labResultSchema = z.object({
  test_name: z.string()
    .min(2, 'Le nom de l\'examen doit contenir au moins 2 caractères'),
  test_date: z.string(),
  result_value: z.string().optional().nullable(),
  result_unit: z.string().optional().nullable(),
  reference_range: z.string().optional().nullable(),
  is_abnormal: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  file_url: z.string().url().optional().nullable(),
  file_type: z.enum(['pdf', 'image', 'other']).optional(),
  performed_by: z.string().uuid().optional().nullable(),
});

export const consultationNoteSchema = z.object({
  consultation_date: z.string(),
  chief_complaint: z.string()
    .min(5, 'Le motif doit contenir au moins 5 caractères'),
  diagnosis: z.string()
    .min(5, 'Le diagnostic doit contenir au moins 5 caractères'),
  treatment_plan: z.string().optional().nullable(),
  follow_up_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  doctor_id: z.string().uuid(),
});

export const completePatientSchema = personalInfoSchema
  .merge(contactInfoSchema)
  .merge(emergencyContactSchema)
  .merge(insuranceInfoSchema);

export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type MedicalHistory = z.infer<typeof medicalHistorySchema>;
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
export type InsuranceInfo = z.infer<typeof insuranceInfoSchema>;
export type VitalSigns = z.infer<typeof vitalSignsSchema>;
export type PrescriptionItem = z.infer<typeof prescriptionItemSchema>;
export type LabResult = z.infer<typeof labResultSchema>;
export type ConsultationNote = z.infer<typeof consultationNoteSchema>;
export type CompletePatient = z.infer<typeof completePatientSchema>;
