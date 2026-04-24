import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RBACProvider } from './contexts/RBACContext';
import { WorkflowProvider } from './contexts/WorkflowContext';
import { StaffLayout } from './components/layout/StaffLayout';
import { DRCDashboard } from './pages/staff/DRCDashboard';
import { DemoLayout } from './pages/demo/DemoLayout';
import { StaffLogin } from './pages/staff/StaffLogin';
import {
  PatientManagement, AppointmentsPage, ConsultationsPage, DoctorsDashboardPage,
  PrescriptionsPage, LaboratoryPage, RadiologyPage, PharmacyDashboard, AccessDenied,
} from './pages/staff/stubs';
import {
  DemoDoctorDashboard, DemoPatientsPage, ConsultationsListPage, NewConsultationPage,
  LabPage, LaborantinDashboard, PharmacyDemoPage, PharmacistDashboard,
} from './pages/demo/stubs';

function AppLoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div className="text-center">
          <div className="font-bold text-gray-900 text-lg">OKAPIA Medical</div>
          <div className="text-sm text-blue-600 font-medium">Chargement en cours...</div>
        </div>
        <div className="flex gap-1.5 mt-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

const demoRoutes = (
  <Route path="/demo" element={<DemoLayout />}>
    <Route index element={<DemoDoctorDashboard />} />
    <Route path="patients" element={<DemoPatientsPage />} />
    <Route path="consultations" element={<ConsultationsListPage />} />
    <Route path="nouvelle-consultation" element={<NewConsultationPage />} />
    <Route path="laboratoire" element={<LabPage />} />
    <Route path="laborantin-dashboard" element={<LaborantinDashboard />} />
    <Route path="pharmacie" element={<PharmacyDemoPage />} />
    <Route path="pharmacien-dashboard" element={<PharmacistDashboard />} />
  </Route>
);

function AppRoutes() {
  const { loading, user } = useAuth();

  if (loading) return <AppLoadingScreen />;

  if (!user) {
    return (
      <Routes>
        <Route path="/staff/login" element={<StaffLogin />} />
        {demoRoutes}
        <Route path="*" element={<Navigate to="/staff/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />

      <Route path="/staff" element={<StaffLayout />}>
        <Route path="dashboard" element={<DRCDashboard />} />
        <Route path="patients" element={<PatientManagement />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="consultations" element={<ConsultationsPage />} />
        <Route path="doctors-dashboard" element={<DoctorsDashboardPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="laboratory" element={<LaboratoryPage />} />
        <Route path="radiology" element={<RadiologyPage />} />
        <Route path="pharmacy" element={<PharmacyDashboard />} />
        <Route path="pharmacy-inventory" element={<PharmacyDashboard />} />
        <Route path="login" element={<Navigate to="/staff/dashboard" replace />} />
      </Route>

      <Route path="/access-denied" element={<AccessDenied />} />

      {demoRoutes}

      <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RBACProvider>
          <WorkflowProvider>
            <AppRoutes />
          </WorkflowProvider>
        </RBACProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
