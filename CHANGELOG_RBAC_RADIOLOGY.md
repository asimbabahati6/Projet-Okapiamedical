import { useRBAC } from '../contexts/RBACContext';

export function useLabPermissions() {
  const { hasPermission, userRole } = useRBAC();

  const isNurse = userRole === 'nurse';

  return {
    // Prescrire un ordre d'analyse (médecin, infirmier)
    canCreateOrders: hasPermission('laboratory.create_orders'),

    // Saisir / modifier les résultats (labo uniquement)
    canEditResults: hasPermission('laboratory.edit_results'),

    // Valider les résultats
    canValidateResults: hasPermission('laboratory.validate'),

    // Gérer les équipements
    canManageEquipment: hasPermission('laboratory.manage_equipment'),

    // Accès complet (admin, directeur)
    hasFullAccess: hasPermission('laboratory.edit_results') && hasPermission('laboratory.validate'),

    // Infirmier : voir les résultats en lecture seule
    canViewResults: hasPermission('laboratory.view') || isNurse,

    // Accès lecture seule au module labo
    canViewOnly: hasPermission('laboratory.view'),

    // Un accès quelconque au module
    hasAnyAccess: hasPermission('laboratory.view'),

    // Tableau de bord sans modification
    isDashboardOnly: hasPermission('laboratory.view') && !hasPermission('laboratory.edit_results'),
  };
}