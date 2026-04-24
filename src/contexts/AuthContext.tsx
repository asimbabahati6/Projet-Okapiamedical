import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  role_id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
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

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isRole: (roleName: string | string[]) => boolean;
  isPatient: () => boolean;
  canAccessBackend: () => boolean;
  canManagePosts: () => boolean;
  canManageEmployees: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          role:roles(name, description, level)
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) return { error: authError };

      if (authData.user) {
        const { data: receptionistRole } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'receptionist')
          .maybeSingle();

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            role_id: receptionistRole?.id,
            full_name: fullName,
            is_active: true,
          });

        if (profileError) return { error: profileError };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  function isRole(roleName: string | string[]): boolean {
    if (!profile?.role) return false;

    if (Array.isArray(roleName)) {
      return roleName.includes(profile.role.name);
    }

    return profile.role.name === roleName;
  }

  function isPatient(): boolean {
    if (!profile?.role) return false;
    return profile.role.name === 'patient';
  }

  function canAccessBackend(): boolean {
    if (!profile?.role) return false;
    const allowedRoles = [
      'doctor',
      'nurse',
      'receptionist',
      'hospital_admin',
      'super_admin',
      'administrative_staff',
      'pharmacist',
      'logistician',
      'directeur_general',
      'medecin_chef_staff',
      'gestionnaire',
      'radio_chef',
      'radio_tech',
      'caissiere',
      'technique',
      'hygiene',
      'lab_technician'
    ];
    return allowedRoles.includes(profile.role.name);
  }

  function canManagePosts(): boolean {
    if (!profile?.role) return false;
    return profile.role.name === 'hospital_admin' || profile.role.name === 'super_admin';
  }

  function canManageEmployees(): boolean {
    if (!profile?.role) return false;
    const allowedRoles = ['super_admin', 'hospital_admin', 'administrative_staff'];
    return allowedRoles.includes(profile.role.name);
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isRole,
    isPatient,
    canAccessBackend,
    canManagePosts,
    canManageEmployees,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
