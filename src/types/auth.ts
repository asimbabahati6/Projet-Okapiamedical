import type { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  role_id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  department_id: string | null;
  is_active: boolean;
  must_change_password: boolean;
  role?: {
    name: string;
    description: string;
    level: number;
  };
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends AuthCredentials {
  fullName: string;
  roleName?: string;
}

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: SupabaseAuthError | Error | null;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
}

export interface PasswordResetResult {
  error: SupabaseAuthError | Error | null;
}

export interface PasswordUpdateResult {
  error: SupabaseAuthError | Error | null;
}

export type AppRole =
  | 'patient'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'hospital_admin'
  | 'super_admin'
  | 'administrative_staff'
  | 'pharmacist'
  | 'logistician'
  | 'directeur_general'
  | 'medecin_chef_staff'
  | 'gestionnaire'
  | 'radio_chef'
  | 'radio_tech'
  | 'caissiere'
  | 'technique'
  | 'hygiene'
  | 'lab_technician'
  | 'dentist'
  | 'physical_therapist';
