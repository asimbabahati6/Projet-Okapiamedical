import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Permissions } from '../../types/consultationHistory';

export function usePermissions(resourceType = 'consultations') {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<Permissions>({
    can_view_own: false,
    can_view_department: false,
    can_view_all: false,
    can_create: false,
    can_edit_own: false,
    can_edit_all: false,
    can_delete: false,
    can_export: false,
    can_share: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      if (!profile?.role_id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('permissions_matrix')
          .select('*')
          .eq('role_id', profile.role_id)
          .eq('resource_type', resourceType)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPermissions({
            can_view_own: data.can_view_own,
            can_view_department: data.can_view_department,
            can_view_all: data.can_view_all,
            can_create: data.can_create,
            can_edit_own: data.can_edit_own,
            can_edit_all: data.can_edit_all,
            can_delete: data.can_delete,
            can_export: data.can_export,
            can_share: data.can_share,
          });
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [profile?.role_id, resourceType]);

  return { permissions, loading };
}
