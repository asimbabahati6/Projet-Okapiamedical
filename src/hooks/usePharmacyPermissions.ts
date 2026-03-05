import { useRBAC } from '../contexts/RBACContext';

export function usePharmacyPermissions() {
  const { hasPermission } = useRBAC();

  return {
    canDispense: hasPermission('pharmacy_dispense'),
    canManageInventory: hasPermission('pharmacy_manage_inventory'),
    canReceiveOrders: hasPermission('pharmacy_receive_orders'),
    hasFullAccess: hasPermission('pharmacy_full_access'),
    isViewOnly: hasPermission('pharmacy_view_availability') && !hasPermission('pharmacy_full_access'),
    canViewAvailability: hasPermission('pharmacy_view_availability'),
    canEditInventory: hasPermission('edit_pharmacy_inventory'),
    hasAnyAccess: hasPermission('pharmacy_view_availability') || hasPermission('pharmacy_full_access')
  };
}
