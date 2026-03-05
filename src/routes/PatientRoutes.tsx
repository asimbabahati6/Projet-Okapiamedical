import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { UserRole } from '@/core/types/enums';
import { PatientLayout } from '@/modules/patient/PatientLayout';
import { PatientDashboard } from '@/modules/patient/pages/PatientDashboard';

const PatientAppointments = React.lazy(() =>
  import('@/modules/patient/pages/AppointmentsPage').then(m => ({ default: m.AppointmentsPage }))
);
const PatientResults = React.lazy(() =>
  import('@/modules/patient/pages/ResultsPage').then(m => ({ default: m.ResultsPage }))
);
const PatientPrescriptions = React.lazy(() =>
  import('@/modules/patient/pages/PrescriptionsPage').then(m => ({ default: m.PrescriptionsPage }))
);
const PatientHistory = React.lazy(() =>
  import('@/modules/patient/pages/HistoryPage').then(m => ({ default: m.HistoryPage }))
);
const PatientProfile = React.lazy(() =>
  import('@/modules/patient/pages/ProfilePage').then(m => ({ default: m.ProfilePage }))
);

export const PatientRoutes: React.FC = () => {
  return (
    <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
      <Routes>
        <Route path="/" element={<PatientLayout />}>
          <Route index element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route
            path="appointments/*"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <PatientAppointments />
              </React.Suspense>
            }
          />
          <Route
            path="results"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <PatientResults />
              </React.Suspense>
            }
          />
          <Route
            path="prescriptions"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <PatientPrescriptions />
              </React.Suspense>
            }
          />
          <Route
            path="history"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <PatientHistory />
              </React.Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <React.Suspense fallback={<div>Chargement...</div>}>
                <PatientProfile />
              </React.Suspense>
            }
          />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
};
