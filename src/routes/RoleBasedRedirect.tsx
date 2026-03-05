import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/core/types/enums';

export const RoleBasedRedirect: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/staff/login" replace />;
  }

  const roleRoutes: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: '/admin/dashboard',
    [UserRole.HOSPITAL_ADMIN]: '/admin/dashboard',
    [UserRole.DOCTOR]: '/doctor/dashboard',
    [UserRole.NURSE]: '/staff/dashboard',
    [UserRole.PHARMACIST]: '/pharmacy/dashboard',
    [UserRole.RECEPTIONIST]: '/staff/dashboard',
    [UserRole.LAB_TECHNICIAN]: '/laboratory/dashboard',
    [UserRole.PATIENT]: '/patient/dashboard'
  };

  const redirectPath = roleRoutes[profile.role as UserRole] || '/staff/dashboard';

  return <Navigate to={redirectPath} replace />;
};
