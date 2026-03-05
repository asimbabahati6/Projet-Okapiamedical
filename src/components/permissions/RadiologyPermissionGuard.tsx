import { ReactNode } from 'react';
import { Lock, CheckCircle } from 'lucide-react';
import { useRBAC } from '@/contexts/RBACContext';

interface RadiologyPermissionGuardProps {
  children: ReactNode;
  requires: 'upload_images' | 'modify_report' | 'validate_report' | 'delete_report';
  reportStatus?: 'draft' | 'technical_review' | 'validated' | 'cancelled';
  isLocked?: boolean;
  fallback?: ReactNode;
  showTooltip?: boolean;
}

export function RadiologyPermissionGuard({
  children,
  requires,
  reportStatus,
  isLocked = false,
  fallback,
  showTooltip = true
}: RadiologyPermissionGuardProps) {
  const { userRole, actualRole, isSimulationMode } = useRBAC();

  const effectiveRole = isSimulationMode ? userRole : actualRole;

  const isRadioChef = effectiveRole === 'radio_chef' || effectiveRole === 'directeur_general' || effectiveRole === 'medecin_chef_staff';
  const isRadioTech = effectiveRole === 'radio_tech';

  const hasPermission = (() => {
    if (isLocked && requires === 'modify_report' && !isRadioChef) {
      return false;
    }

    if (reportStatus === 'validated' && requires === 'modify_report' && !isRadioChef) {
      return false;
    }

    switch (requires) {
      case 'upload_images':
        return isRadioChef || isRadioTech;

      case 'modify_report':
        if (reportStatus === 'validated' || isLocked) {
          return isRadioChef;
        }
        return isRadioChef || isRadioTech;

      case 'validate_report':
        return isRadioChef;

      case 'delete_report':
        return isRadioChef;

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
    const tooltipMessage = (() => {
      if (isLocked || reportStatus === 'validated') {
        return 'Rapport validé et verrouillé - Réservé au Chef Radiologie';
      }
      switch (requires) {
        case 'validate_report':
          return 'Validation réservée au Chef Radiologie';
        case 'delete_report':
          return 'Suppression réservée au Chef Radiologie';
        case 'modify_report':
          return 'Modification non autorisée pour ce rapport';
        default:
          return 'Action non autorisée';
      }
    })();

    return (
      <div className="relative group inline-block">
        <div className="opacity-50 cursor-not-allowed pointer-events-none">
          {children}
        </div>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3" />
              <span>{tooltipMessage}</span>
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

export function RadiologyValidatedBadge({
  validatedBy,
  validatedAt
}: {
  validatedBy?: string;
  validatedAt?: string;
}) {
  if (!validatedBy || !validatedAt) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
      <CheckCircle className="w-3 h-3" />
      Validé par {validatedBy}
    </div>
  );
}

export function RadiologyLockedBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
      <Lock className="w-3 h-3" />
      Rapport verrouillé
    </div>
  );
}

export function useRadiologyPermissions() {
  const { userRole, actualRole, isSimulationMode } = useRBAC();

  const effectiveRole = isSimulationMode ? userRole : actualRole;

  const isRadioChef = effectiveRole === 'radio_chef' || effectiveRole === 'directeur_general' || effectiveRole === 'medecin_chef_staff';
  const isRadioTech = effectiveRole === 'radio_tech';
  const canAccessRadiology = isRadioChef || isRadioTech;

  return {
    canUploadImages: isRadioChef || isRadioTech,
    canCreateReports: isRadioChef || isRadioTech,
    canModifyDraftReports: isRadioChef || isRadioTech,
    canModifyValidatedReports: isRadioChef,
    canValidateReports: isRadioChef,
    canDeleteReports: isRadioChef,
    canViewAllReports: canAccessRadiology,
    isRadioChef,
    isRadioTech,
    canAccessRadiology
  };
}
