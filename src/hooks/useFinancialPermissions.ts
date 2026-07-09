import { useRBAC } from '@/contexts/RBACContext';

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
  canViewReceipts: boolean;
  canMarkConventionPaid: boolean;
  canMarkHonorairesPaid: boolean;
  isDirecteurGeneral: boolean;
  isGestionnaire: boolean;
  isCaissiere: boolean;
  isAccountant: boolean;
}

export function useFinancialPermissions(): FinancialPermissions {
  const { userRole, actualRole, isSimulationMode } = useRBAC();

  const effectiveRole = isSimulationMode ? userRole : actualRole;

  const isDirecteurGeneral = effectiveRole === 'directeur_general' || effectiveRole === 'admin';
  const isGestionnaire     = effectiveRole === 'gestionnaire';
  const isCaissiere        = effectiveRole === 'caissiere';
  const isAccountant       = effectiveRole === 'accountant';
  const isReceptionist     = effectiveRole === 'receptionist';

  return {
    canViewInvoices: isDirecteurGeneral || isGestionnaire || isCaissiere || isAccountant,

    canCreateInvoices: isDirecteurGeneral || isGestionnaire || isCaissiere,

    canModifyPaidInvoices: isDirecteurGeneral,

    canModifyUnpaidInvoices: isDirecteurGeneral,

    canCancelInvoices: isDirecteurGeneral,

    canViewTreasury: isDirecteurGeneral || isGestionnaire || isAccountant,

    canModifyTreasury: isDirecteurGeneral,

    canViewGlobalFinancials: isDirecteurGeneral || isGestionnaire || isAccountant,

    canModifyGlobalFinancials: isDirecteurGeneral,

    canModifyConsultationRates: isDirecteurGeneral,

    canModifyOperationalBudget: isDirecteurGeneral || isGestionnaire,

    canApproveSupplyOrders: isDirecteurGeneral || isGestionnaire,

    canViewCashFlow: isDirecteurGeneral || isGestionnaire || isAccountant,

    canAccessCashRegister: isDirecteurGeneral || isCaissiere,

    canViewReceipts: isDirecteurGeneral || isGestionnaire || isCaissiere || isAccountant || isReceptionist,

    canMarkConventionPaid: isDirecteurGeneral || isAccountant,

    canMarkHonorairesPaid: isDirecteurGeneral || isAccountant,

    isDirecteurGeneral,
    isGestionnaire,
    isCaissiere,
    isAccountant,
  };
}
