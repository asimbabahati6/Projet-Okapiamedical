import { supabase } from '../lib/supabase';

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'validate'
  | 'cancel'
  | 'transfer'
  | 'close'
  | 'generate'
  | 'print'
  | 'approve'
  | 'return';

export type ActivityModule =
  | 'auth'
  | 'patients'
  | 'appointments'
  | 'consultations'
  | 'reports'
  | 'expenses'
  | 'roles'
  | 'users'
  | 'pharmacy'
  | 'laboratory'
  | 'radiology';

interface LogActivityOptions {
  metadata?: Record<string, unknown>;
}

export async function logActivity(
  action: ActivityAction,
  module: ActivityModule,
  description: string,
  options?: LogActivityOptions
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, full_name, role:roles(name)')
      .eq('id', user.id)
      .maybeSingle();

    const userName = profile?.full_name || user.email || '';
    const userRole = (profile?.role as { name: string } | null)?.name || '';

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_name: userName,
      user_role: userRole,
      action,
      module,
      description,
      metadata: options?.metadata || {},
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
