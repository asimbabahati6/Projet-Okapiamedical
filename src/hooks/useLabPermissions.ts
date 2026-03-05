import { useRBAC } from '../contexts/RBACContext';

export function useLabPermissions() {
  const { hasPermission } = useRBAC();

  return {
    canCreateOrders: hasPermission('lab_create_orders'),
    canEditResults: hasPermission('lab_edit_results'),
    canValidateResults: hasPermission('lab_validate_results'),
    canManageEquipment: hasPermission('lab_manage_equipment'),
    hasFullAccess: hasPermission('lab_full_access'),
    isDashboardOnly: hasPermission('lab_dashboard_view') && !hasPermission('lab_full_access'),
    canViewOnly: hasPermission('lab_dashboard_view'),
    hasAnyAccess: hasPermission('lab_dashboard_view') || hasPermission('lab_full_access')
  };
}
