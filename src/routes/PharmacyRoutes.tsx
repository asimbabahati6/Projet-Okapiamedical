import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { UserRole } from '@/core/types/enums';
import { PharmacyLayout } from '@/modules/pharmacy/PharmacyLayout';
import { PharmacyDashboard } from '@/modules/pharmacy/pages/PharmacyDashboard';
import { EnhancedPharmacyPage } from '@/pages/staff/EnhancedPharmacyPage';

const PharmacyInventoryPage = React.lazy(() =>
  import('@/pages/staff/PharmacyInventoryPage').then(m => ({ default: m.default }))
);

const PharmacyPrescriptionsPage = React.lazy(() =>
  import('@/pages/staff/pharmacy/PharmacyPrescriptionsPage').then(m => ({ default: m.default }))
);

const PharmacyLowStockPage = React.lazy(() =>
  import('@/pages/staff/pharmacy/PharmacyLowStockPage').then(m => ({ default: m.default }))
);

const PharmacyOrdersPage = React.lazy(() =>
  import('@/pages/staff/pharmacy/PharmacyOrdersPage').then(m => ({ default: m.default }))
);

const Fallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
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
              <React.Suspense fallback={<Fallback />}>
                <PharmacyInventoryPage />
              </React.Suspense>
            }
          />
          <Route path="inventory-management" element={<EnhancedPharmacyPage />} />
          <Route
            path="prescriptions"
            element={
              <React.Suspense fallback={<Fallback />}>
                <PharmacyPrescriptionsPage />
              </React.Suspense>
            }
          />
          <Route
            path="low-stock"
            element={
              <React.Suspense fallback={<Fallback />}>
                <PharmacyLowStockPage />
              </React.Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <React.Suspense fallback={<Fallback />}>
                <PharmacyOrdersPage />
              </React.Suspense>
            }
          />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
};
