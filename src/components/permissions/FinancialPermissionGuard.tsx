import { ReactNode } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { useFinancialPermissions } from '@/hooks/useFinancialPermissions';

interface FinancialPermissionGuardProps {
  children: ReactNode;
  requires: 'modify_unpaid_invoices' | 'modify_consultation_rates' | 'access_treasury' | 'approve_supply_orders' | 'modify_global_financials';
  fallback?: ReactNode;
  showTooltip?: boolean;
}

export function FinancialPermissionGuard({
  children,
  requires,
  fallback,
  showTooltip = true
}: FinancialPermissionGuardProps) {
  const permissions = useFinancialPermissions();

  const hasPermission = (() => {
    switch (requires) {
      case 'modify_unpaid_invoices':
        return permissions.canModifyUnpaidInvoices;
      case 'modify_consultation_rates':
        return permissions.canModifyConsultationRates;
      case 'access_treasury':
        return permissions.canModifyTreasury;
      case 'approve_supply_orders':
        return permissions.canApproveSupplyOrders;
      case 'modify_global_financials':
        return permissions.canModifyGlobalFinancials;
      default:
        return false;
    }
  })();

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showTooltip) {
    return (
      <div className="relative group inline-block">
        <div className="opacity-50 cursor-not-allowed pointer-events-none">
          {children}
        </div>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3" />
              <span>Réservé au Directeur Général</span>
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function FinancialRestrictionBanner({
  action
}: {
  action: string
}) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-amber-900">
            Action réservée
          </h4>
          <p className="text-sm text-amber-700 mt-1">
            {action} est une action réservée au Directeur Général. En tant que Gestionnaire, vous avez un accès en lecture seule à ces données financières.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ReadOnlyFinancialBadge() {
  const permissions = useFinancialPermissions();

  if (permissions.isDirecteurGeneral) {
    return null;
  }

  if (permissions.isGestionnaire || permissions.isAccountant) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
        <Lock className="w-3 h-3" />
        Lecture seule
      </div>
    );
  }

  if (permissions.isCaissiere) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
        <Lock className="w-3 h-3" />
        Accès limité
      </div>
    );
  }

  return null;
}
