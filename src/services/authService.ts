import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  AuthCredentials,
  RegisterCredentials,
  AuthResult,
  PasswordResetResult,
  PasswordUpdateResult,
  UserProfile,
} from '../types/auth';

// ---------------------------------------------------------------------------
// Pure service functions — usable outside React components
// ---------------------------------------------------------------------------

/**
 * Authentifie un utilisateur avec email et mot de passe.
 */
export async function signIn({ email, password }: AuthCredentials): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data.user, session: data.session, error };
  } catch (error) {
    return { user: null, session: null, error: error as Error };
  }
}

/**
 * Crée un nouveau compte utilisateur et son profil associé.
 */
export async function signUp({
  email,
  password,
  fullName,
  roleName = 'receptionist',
}: RegisterCredentials): Promise<AuthResult> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return { user: null, session: null, error: authError };

    if (authData.user) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .maybeSingle();

      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: authData.user.id,
        role_id: roleData?.id ?? null,
        full_name: fullName,
        is_active: true,
      });

      if (profileError) return { user: null, session: null, error: profileError };
    }

    return { user: authData.user, session: authData.session, error: null };
  } catch (error) {
    return { user: null, session: null, error: error as Error };
  }
}

/**
 * Déconnecte l'utilisateur courant.
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Envoie un email de réinitialisation de mot de passe.
 */
export async function resetPassword(email: string): Promise<PasswordResetResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/changer-mot-de-passe`,
    });
    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Met à jour le mot de passe de l'utilisateur authentifié.
 */
export async function updatePassword(newPassword: string): Promise<PasswordUpdateResult> {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Récupère la session active courante.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

/**
 * Force le rafraîchissement du token de session.
 */
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();
  return { session: data.session, user: data.user, error };
}

/**
 * Récupère le profil complet d'un utilisateur depuis user_profiles.
 */
export async function fetchUserProfile(userId: string): Promise<{
  profile: UserProfile | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*, role:roles(name, description, level)')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return { profile: data as UserProfile | null, error: null };
  } catch (error) {
    return { profile: null, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// React hook — gestion d'état pour les composants
// ---------------------------------------------------------------------------

interface UseAuthServiceState {
  loading: boolean;
  error: string | null;
}

/**
 * Hook utilitaire pour les actions d'auth avec gestion d'état locale.
 *
 * @example
 * const { signInWithState, loading, error } = useAuthService();
 * await signInWithState({ email, password });
 */
export function useAuthService() {
  const [state, setState] = useState<UseAuthServiceState>({ loading: false, error: null });

  const setLoading = (loading: boolean) => setState(s => ({ ...s, loading }));
  const setError = (message: string | null) => setState(s => ({ ...s, error: message }));

  const signInWithState = useCallback(async (credentials: AuthCredentials) => {
    setLoading(true);
    setError(null);
    const result = await signIn(credentials);
    if (result.error) {
      setError(
        result.error.message.includes('Invalid login credentials')
          ? 'Email ou mot de passe incorrect.'
          : 'Une erreur est survenue lors de la connexion.'
      );
    }
    setLoading(false);
    return result;
  }, []);

  const signUpWithState = useCallback(async (credentials: RegisterCredentials) => {
    setLoading(true);
    setError(null);
    const result = await signUp(credentials);
    if (result.error) {
      setError(
        result.error.message.includes('already registered')
          ? 'Cette adresse email est déjà utilisée.'
          : 'Une erreur est survenue lors de la création du compte.'
      );
    }
    setLoading(false);
    return result;
  }, []);

  const signOutWithState = useCallback(async () => {
    setLoading(true);
    const result = await signOut();
    if (result.error) setError('Erreur lors de la déconnexion.');
    setLoading(false);
    return result;
  }, []);

  const resetPasswordWithState = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    const result = await resetPassword(email);
    if (result.error) setError('Impossible d\'envoyer l\'email de réinitialisation.');
    setLoading(false);
    return result;
  }, []);

  const updatePasswordWithState = useCallback(async (newPassword: string) => {
    setLoading(true);
    setError(null);
    const result = await updatePassword(newPassword);
    if (result.error) setError('Impossible de mettre à jour le mot de passe.');
    setLoading(false);
    return result;
  }, []);

  return {
    ...state,
    signInWithState,
    signUpWithState,
    signOutWithState,
    resetPasswordWithState,
    updatePasswordWithState,
  };
}
