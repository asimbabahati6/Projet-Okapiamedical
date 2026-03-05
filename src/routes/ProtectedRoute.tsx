import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRBAC } from '@/contexts/RBACContext';
import { UserRole } from '@/core/types/enums';
import { mapRbacToEnum, mapDbToEnum, isAdminRole } from '@/utils/roleMapping';

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
