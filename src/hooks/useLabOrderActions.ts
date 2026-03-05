import { useRolePermissions } from './useRolePermissions';
import { useToast } from './useToast';

interface LabOrderData {
  patient_id: string;
  doctor_id: string;
  test_type: string;
  priority?: string;
  notes?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export function useLabOrderActions() {
  const permissions = useRolePermissions('laboratory');
  const { showToast } = useToast();

  const getErrorMessage = (action: string): string => {
    const role = permissions.role;

    if (action === 'create') {
      return role === 'doctor'
        ? "Les médecins peuvent prescrire de nouvelles analyses via le formulaire"
        : "Seul le personnel de laboratoire peut créer des analyses";
    }

    if (action === 'edit') {
      return role === 'doctor'
        ? "Les médecins ne peuvent pas modifier les résultats d'analyse. Contactez le laboratoire."
        : "Modification réservée au personnel de laboratoire autorisé";
    }

    if (action === 'delete') {
      return "Suppression réservée aux administrateurs et responsables de laboratoire";
    }

    return "Action non autorisée pour votre rôle";
  };

  const validateCreate = (): ActionResult => {
    if (!permissions.canCreate) {
      const message = getErrorMessage('create');
      showToast(message, 'error');
      console.warn('Unauthorized lab order creation attempt', {
        role: permissions.role,
        timestamp: new Date().toISOString()
      });
      return { success: false, error: 'PERMISSION_DENIED' };
    }
    return { success: true };
  };

  const validateEdit = (): ActionResult => {
    if (!permissions.canEdit) {
      const message = getErrorMessage('edit');
      showToast(message, 'error');
      console.warn('Unauthorized lab order edit attempt', {
        role: permissions.role,
        timestamp: new Date().toISOString()
      });
      return { success: false, error: 'PERMISSION_DENIED' };
    }
    return { success: true };
  };

  const validateDelete = (): ActionResult => {
    if (!permissions.canDelete) {
      const message = getErrorMessage('delete');
      showToast(message, 'error');
      console.warn('Unauthorized lab order delete attempt', {
        role: permissions.role,
        timestamp: new Date().toISOString()
      });
      return { success: false, error: 'PERMISSION_DENIED' };
    }
    return { success: true };
  };

  const validateView = (): ActionResult => {
    if (!permissions.canViewDetails) {
      showToast("Accès en consultation non autorisé", 'error');
      return { success: false, error: 'PERMISSION_DENIED' };
    }
    return { success: true };
  };

  return {
    permissions,
    validateCreate,
    validateEdit,
    validateDelete,
    validateView,
    getErrorMessage
  };
}
