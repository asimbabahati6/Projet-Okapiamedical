import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { UserRole } from '@/core/types/enums';
import { PharmacyLayout } from '@/modules/pharmacy/PharmacyLayout';
import { PharmacyDashboard } from '@/modules/pharmacy/pages/PharmacyDashboard';
import { EnhancedPharmacyPage } from '@/pages/staff/EnhancedPharmacyPage';

const PharmacyInventoryPage = React.lazy(() =>
  import('@/pages/staff/PharmacyInventoryPage').then(m => ({ default: m.PharmacyInventoryPage }))
);

export const PharmacyRoutes: React.FC = () => {
  return (
    <ProtectedRoute allowedRoles={[UserRole.PHARMACIST, UserRole.SUPER_ADMIN, UserRole.DOCTOR]}>
      <Routes>
        <Route path="/" element={<PharmacyLayout />}>
          <Route index element={<Navigate to="/pharmacy/dashboard" replace />} />
          <Route path="dashboard" element={<PharmacyDashboard />} />
          <Route
            path="inventory"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <PharmacyInventoryPage />
              </React.Suspense>
            }
          />
          <Route path="inventory-management" element={<EnhancedPharmacyPage />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
};
