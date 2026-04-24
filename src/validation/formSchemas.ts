import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues, type FieldValues } from 'react-hook-form';

const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Mot de passe actuel requis'),
    newPassword: z
      .string()
      .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
    confirmPassword: z.string().min(1, 'Confirmation requise'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
});

export const appointmentSchema = z.object({
  patient_id: z.string().uuid('Patient invalide'),
  doctor_id: z.string().uuid('Médecin invalide').optional().nullable(),
  department_id: z.string().uuid('Département invalide').optional().nullable(),
  appointment_date: z.string().min(1, 'La date est requise'),
  appointment_time: z.string().min(1, "L'heure est requise"),
  type: z.enum(['consultation', 'follow_up', 'emergency', 'telemedicine']).catch('consultation'),
  reason: z
    .string()
    .min(5, 'Le motif doit contenir au moins 5 caractères')
    .max(500, 'Le motif ne peut pas dépasser 500 caractères'),
  notes: z.string().max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères').optional().nullable(),
  is_telemedicine: z.boolean().default(false),
});

export const consultationSchema = z.object({
  patient_id: z.string().uuid('Patient invalide'),
  appointment_id: z.string().uuid().optional().nullable(),
  consultation_date: z.string().min(1, 'La date est requise'),
  reason: z
    .string()
    .min(5, 'Le motif doit contenir au moins 5 caractères')
    .max(500, 'Le motif ne peut pas dépasser 500 caractères'),
  diagnosis: z
    .string()
    .min(5, 'Le diagnostic doit contenir au moins 5 caractères')
    .max(2000, 'Le diagnostic ne peut pas dépasser 2000 caractères')
    .optional()
    .nullable(),
  treatment: z.string().max(2000, 'Le traitement ne peut pas dépasser 2000 caractères').optional().nullable(),
  notes: z.string().max(2000, 'Les notes ne peuvent pas dépasser 2000 caractères').optional().nullable(),
  follow_up_date: z.string().optional().nullable(),
  vital_signs: z
    .object({
      blood_pressure: z.string().optional(),
      heart_rate: z.number().min(30).max(220).optional(),
      temperature: z.number().min(35).max(43).optional(),
      weight: z.number().min(1).max(500).optional(),
    })
    .optional(),
});

export const postSchema = z.object({
  title: z
    .string()
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  content: z.string().min(20, 'Le contenu doit contenir au moins 20 caractères'),
  excerpt: z.string().max(500, 'Le résumé ne peut pas dépasser 500 caractères').optional().nullable(),
  category_id: z.string().uuid('Catégorie invalide').optional().nullable(),
  status: z.enum(['brouillon', 'publié', 'archivé']).catch('brouillon'),
  featured_image_url: z.string().url("URL d'image invalide").optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  is_featured: z.boolean().default(false),
});

export const contactMessageSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string().email('Adresse email invalide'),
  phone: z.string().regex(phoneRegex, 'Numéro de téléphone invalide').optional().nullable(),
  subject: z
    .string()
    .min(5, 'Le sujet doit contenir au moins 5 caractères')
    .max(200, 'Le sujet ne peut pas dépasser 200 caractères'),
  message: z
    .string()
    .min(20, 'Le message doit contenir au moins 20 caractères')
    .max(2000, 'Le message ne peut pas dépasser 2000 caractères'),
});

export const labOrderSchema = z.object({
  patient_id: z.string().uuid('Patient invalide'),
  ordered_by: z.string().uuid('Médecin prescripteur invalide'),
  tests: z
    .array(
      z.object({
        test_name: z.string().min(2, "Le nom de l'examen est requis"),
        test_code: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .min(1, 'Au moins un examen est requis'),
  priority: z.enum(['normal', 'urgent', 'stat']).catch('normal'),
  clinical_notes: z.string().max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères').optional().nullable(),
  sample_type: z.string().optional().nullable(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type ConsultationFormData = z.infer<typeof consultationSchema>;
export type PostFormData = z.infer<typeof postSchema>;
export type ContactMessageFormData = z.infer<typeof contactMessageSchema>;
export type LabOrderFormData = z.infer<typeof labOrderSchema>;

export function createFormResolver<T extends z.ZodTypeAny>(schema: T) {
  return zodResolver(schema);
}

interface UseFormWithValidationOptions<T extends FieldValues> {
  defaultValues?: DefaultValues<T>;
}

export function useFormWithValidation<T extends FieldValues>(
  schema: z.ZodType<T>,
  options: UseFormWithValidationOptions<T> = {}
) {
  const form = useForm<T>({
    resolver: zodResolver(schema) as any,
    defaultValues: options.defaultValues,
    mode: 'onBlur',
  });

  const errors = form.formState.errors;
  const isSubmitting = form.formState.isSubmitting;
  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;

  function getFieldError(field: keyof T): string | undefined {
    const err = errors[field as string];
    return err?.message as string | undefined;
  }

  return { form, errors, isSubmitting, isDirty, isValid, getFieldError };
}
