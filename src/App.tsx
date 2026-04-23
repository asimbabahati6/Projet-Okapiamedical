import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RBACProvider } from './contexts/RBACContext';
import { WorkflowProvider } from './contexts/WorkflowContext';
import { StaffLayout } from './components/layout/StaffLayout';
import { DRCDashboard } from './pages/staff/DRCDashboard';
import { DemoLayout } from './pages/demo/DemoLayout';
import {
  PatientManagement, AppointmentsPage, ConsultationsPage, DoctorsDashboardPage,
  PrescriptionsPage, LaboratoryPage, RadiologyPage, PharmacyDashboard, AccessDenied,
} from './pages/staff/stubs';
import {
  DemoDoctorDashboard, DemoPatientsPage, ConsultationsListPage, NewConsultationPage,
  LabPage, LaborantinDashboard, PharmacyDemoPage, PharmacistDashboard,
} from './pages/demo/stubs';

export default function App() {
  return (
    <BrowserRouter>
      <RBACProvider>
        <WorkflowProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />

            {/* Staff portal */}
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
            </Route>

            <Route path="/access-denied" element={<AccessDenied />} />

            {/* Demo RBAC workflow module */}
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

            <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
          </Routes>
        </WorkflowProvider>
      </RBACProvider>
    </BrowserRouter>
  );
}
