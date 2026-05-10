import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRBAC } from '@/contexts/RBACContext';
import { UserRole } from '@/core/types/enums';
import { mapRbacToEnum, mapDbToEnum, isAdminRole } from '@/utils/roleMapping';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles
}) => {
  const { user, profile, loading: authLoading } = useAuth();
  const { userRole, actualRole, isSimulationMode, loading: rbacLoading } = useRBAC();
  const location = useLocation();

  if (authLoading || rbacLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/staff/login" state={{ from: location }} replace />;
  }

  if (user && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Session incomplète</h2>
        <p className="text-gray-600 text-sm text-center max-w-sm mb-5">
          Votre profil n'a pas pu être chargé. Veuillez rafraîchir la page ou vous reconnecter.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
          <a
            href="/staff/login"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
          >
            Se reconnecter
          </a>
        </div>
      </div>
    );
  }

  // Force password change for accounts with temporary passwords
  if (profile?.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    let effectiveRole: UserRole | undefined;

    // Determine the effective role
    if (isSimulationMode) {
      // Use the simulated role when simulation mode is active
      effectiveRole = mapRbacToEnum(userRole);
    } else {
      // Use the actual profile role from database
      effectiveRole = profile?.role ? mapDbToEnum(profile.role) : undefined;
    }

    // Always allow admin roles
    if (effectiveRole && isAdminRole(effectiveRole)) {
      return <>{children}</>;
    }

    // Check if the effective role is in the allowed roles
    if (effectiveRole && !allowedRoles.includes(effectiveRole)) {
      return <Navigate to="/access-denied" replace />;
    }

    // If no effective role, deny access
    if (!effectiveRole) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <>{children}</>;
};
