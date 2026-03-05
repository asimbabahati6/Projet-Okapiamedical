import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { UserRole } from '@/core/types/enums';
import { DoctorLayout } from '@/modules/doctor/DoctorLayout';
import { DoctorDashboard } from '@/modules/doctor/pages/DoctorDashboard';

const DoctorPatientFiles = React.lazy(() =>
  import('@/modules/doctor/pages/PatientFiles').then(m => ({ default: m.PatientFiles }))
);
const DoctorConsultations = React.lazy(() =>
  import('@/modules/doctor/pages/ConsultationsPage').then(m => ({ default: m.ConsultationsPage }))
);
const DoctorPrescriptions = React.lazy(() =>
  import('@/modules/doctor/pages/PrescriptionsPage').then(m => ({ default: m.PrescriptionsPage }))
);
const DoctorLabOrders = React.lazy(() =>
  import('@/modules/doctor/pages/LabOrdersPage').then(m => ({ default: m.LabOrdersPage }))
);
const DoctorSchedule = React.lazy(() =>
  import('@/modules/doctor/pages/SchedulePage').then(m => ({ default: m.SchedulePage }))
);

export const DoctorRoutes: React.FC = () => {
  return (
    <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
      <Routes>
        <Route path="/" element={<DoctorLayout />}>
          <Route index element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route
            path="patients"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <DoctorPatientFiles />
              </React.Suspense>
            }
          />
          <Route
            path="consultations"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <DoctorConsultations />
              </React.Suspense>
            }
          />
          <Route
            path="prescriptions"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <DoctorPrescriptions />
              </React.Suspense>
            }
          />
          <Route
            path="lab-orders"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <DoctorLabOrders />
              </React.Suspense>
            }
          />
          <Route
            path="schedule"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <DoctorSchedule />
              </React.Suspense>
            }
          />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
};
