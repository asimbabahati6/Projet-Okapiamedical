import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { UserRole } from '@/core/types/enums';
import { LaboratoryLayout } from '@/modules/laboratory/LaboratoryLayout';
import { LabDashboard } from '@/modules/laboratory/pages/LabDashboard';

const AnalysisQueue = React.lazy(() =>
  import('@/modules/laboratory/pages/AnalysisQueue').then(m => ({ default: m.AnalysisQueue }))
);
const ResultsEntry = React.lazy(() =>
  import('@/modules/laboratory/pages/ResultsEntry').then(m => ({ default: m.ResultsEntry }))
);
const LabHistory = React.lazy(() =>
  import('@/modules/laboratory/pages/LabHistory').then(m => ({ default: m.LabHistory }))
);
const EquipmentManagement = React.lazy(() =>
  import('@/modules/laboratory/pages/EquipmentPage').then(m => ({ default: m.EquipmentPage }))
);

export const LaboratoryRoutes: React.FC = () => {
  return (
    <ProtectedRoute allowedRoles={[UserRole.LAB_TECHNICIAN, UserRole.DOCTOR, UserRole.SUPER_ADMIN]}>
      <Routes>
        <Route path="/" element={<LaboratoryLayout />}>
          <Route index element={<Navigate to="/laboratory/dashboard" replace />} />
          <Route path="dashboard" element={<LabDashboard />} />
          <Route
            path="queue"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <AnalysisQueue />
              </React.Suspense>
            }
          />
          <Route
            path="results"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <ResultsEntry />
              </React.Suspense>
            }
          />
          <Route
            path="history"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <LabHistory />
              </React.Suspense>
            }
          />
          <Route
            path="equipment"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <EquipmentManagement />
              </React.Suspense>
            }
          />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
};
