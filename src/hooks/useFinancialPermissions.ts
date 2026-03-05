import { useRBAC } from '@/contexts/RBACContext';
import { UserRole } from '@/config/rbac';

export interface FinancialPermissions {
  canViewInvoices: boolean;
  canCreateInvoices: boolean;
  canModifyPaidInvoices: boolean;
  canModifyUnpaidInvoices: boolean;
  canCancelInvoices: boolean;
  canViewTreasury: boolean;
  canModifyTreasury: boolean;
  canViewGlobalFinancials: boolean;
  canModifyGlobalFinancials: boolean;
  canModifyConsultationRates: boolean;
  canModifyOperationalBudget: boolean;
  canApproveSupplyOrders: boolean;
  canViewCashFlow: boolean;
  canAccessCashRegister: boolean;
  isDirecteurGeneral: boolean;
  isGestionnaire: boolean;
  isCaissiere: boolean;
}

export function useFinancialPermissions(): FinancialPermissions {
  const { userRole, actualRole, isSimulationMode } = useRBAC();

  const effectiveRole = isSimulationMode ? userRole : actualRole;

  const isDirecteurGeneral = effectiveRole === 'directeur_general' || effectiveRole === 'admin';
  const isGestionnaire = effectiveRole === 'gestionnaire';
  const isCaissiere = effectiveRole === 'caissiere';
  const isAccountant = effectiveRole === 'accountant';

  return {
    canViewInvoices: isDirecteurGeneral || isGestionnaire || isCaissiere || isAccountant,

    canCreateInvoices: isDirecteurGeneral || isGestionnaire || isCaissiere || isAccountant,

    canModifyPaidInvoices: isDirecteurGeneral,

    canModifyUnpaidInvoices: isDirecteurGeneral,

    canCancelInvoices: isDirecteurGeneral,

    canViewTreasury: isDirecteurGeneral || isGestionnaire,

    canModifyTreasury: isDirecteurGeneral,

    canViewGlobalFinancials: isDirecteurGeneral || isGestionnaire,

    canModifyGlobalFinancials: isDirecteurGeneral,

    canModifyConsultationRates: isDirecteurGeneral,

    canModifyOperationalBudget: isDirecteurGeneral || isGestionnaire,

    canApproveSupplyOrders: isDirecteurGeneral || isGestionnaire,

    canViewCashFlow: isDirecteurGeneral || isGestionnaire,

    canAccessCashRegister: isDirecteurGeneral || isCaissiere,

    isDirecteurGeneral,
    isGestionnaire,
    isCaissiere
  };
}
