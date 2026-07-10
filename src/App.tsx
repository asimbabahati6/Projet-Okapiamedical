import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './core/contexts/NotificationContext';
import { WorkflowProvider } from './core/contexts/WorkflowContext';
import { RBACProvider } from './contexts/RBACContext';
import { PublicLayout } from './pages/public/PublicLayout';
import { StaffLogin } from './pages/staff/StaffLogin';
import { StaffRegister } from './pages/staff/StaffRegister';
import { StaffLayout } from './pages/staff/StaffLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleBasedRedirect } from './routes/RoleBasedRedirect';
import { DoctorRoutes } from './routes/DoctorRoutes';
import { LaboratoryRoutes } from './routes/LaboratoryRoutes';
import { PharmacyRoutes } from './routes/PharmacyRoutes';
import { PatientRoutes } from './routes/PatientRoutes';
import { AccessDenied } from './components/AccessDenied';

// Import all staff pages
import { DRCDashboard } from './pages/staff/DRCDashboard';
import { EmployeesPage } from './pages/staff/EmployeesPage';
import { PayrollPage } from './pages/staff/PayrollPage';
import { ShiftSchedulingPage } from './pages/staff/ShiftSchedulingPage';
import { InsurancePage } from './pages/staff/InsurancePage';
import ContractsPage from './pages/staff/hr/contracts/ContractsPage';
import AdministrationDashboard from './pages/staff/AdministrationDashboard';
import AdministrativeStaffPage from './pages/staff/AdministrativeStaffPage';
import AdminTasksPage from './pages/staff/AdminTasksPage';
import AdminPoliciesPage from './pages/staff/AdminPoliciesPage';
import AdminFacilitiesPage from './pages/staff/AdminFacilitiesPage';
import AdminVendorsPage from './pages/staff/AdminVendorsPage';
import { AppointmentsPage } from './pages/staff/AppointmentsPage';
import { LaboratoryPage } from './pages/staff/LaboratoryPage';
import LabReportTemplatePage from './pages/staff/laboratory/LabReportTemplatePage';
import DoctorsDashboardPage from './pages/staff/DoctorsDashboardPage';
import PurchaseOrdersPage from './pages/staff/PurchaseOrdersPage';
import { PharmacyPage } from './pages/staff/PharmacyPage';
import { PrescriptionsPage } from './pages/staff/PrescriptionsPage';
import DoctorVisibilityPage from './pages/staff/DoctorVisibilityPage';
import LogisticsPage from './pages/staff/LogisticsPage';
import TransportManagementPage from './pages/staff/TransportManagementPage';
import SuppliersPage from './pages/staff/SuppliersPage';
import { PatientCheckInPage } from './pages/staff/PatientCheckInPage';
import ExpenseManagementPage from './pages/staff/ExpenseManagementPage';
import SortiesCaissePage from './pages/staff/SortiesCaissePage';
import { BillingPage } from './pages/staff/BillingPage';
import { BillingAnalyticsPage } from './pages/staff/BillingAnalyticsPage';
import FinancialAnalytics from './pages/finance/FinancialAnalytics';
import UnifiedPersonnelPage from './pages/staff/UnifiedPersonnelPage';
import { RoleManagementPage } from './pages/staff/RoleManagementPage';
import RadiologyPage from './pages/staff/RadiologyPage';
import PrescribeExamPage from './pages/staff/radiology/PrescribeExamPage';
import ExamQueuePage from './pages/staff/radiology/ExamQueuePage';
import ExamWorkspacePage from './pages/staff/radiology/ExamWorkspacePage';
import ReportViewerPage from './pages/staff/radiology/ReportViewerPage';
import ExamHistoryPage from './pages/staff/radiology/ExamHistoryPage';
import ReportTemplatePage from './pages/staff/radiology/ReportTemplatePage';
import OkapiaConnectPage from './pages/staff/OkapiaConnectPage';
import MessagingPage from './pages/staff/MessagingPage';
import SmartPunchPage from './pages/staff/SmartPunchPage';
import SmartPunchDashboard from './pages/staff/SmartPunchDashboard';
import { FeedbackDashboard } from './pages/staff/FeedbackDashboard';
import { FeedbackPage } from './pages/public/FeedbackPage';
import AdminSetupPage from './pages/AdminSetupPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { PostsManagementPage } from './pages/staff/PostsManagementPage';
import CaissePage from './pages/staff/CaissePage';
import MedicalActsPricingPage from './pages/staff/MedicalActsPricingPage';
import DoctorQueuePage from './pages/staff/DoctorQueuePage';
import PendingRegistrationsPage from './pages/staff/PendingRegistrationsPage';
import PermissionManagementPage from './pages/staff/PermissionManagementPage';
import PatientFlowDashboard from './pages/staff/PatientFlowDashboard';
import MedicalConsultationPage from './pages/staff/MedicalConsultationPage';
import MedicalReportPage from './pages/staff/medical/MedicalReportPage';
import StaffProfilePage from './pages/staff/StaffProfilePage';
import ExchangeRatesPage from './pages/staff/ExchangeRatesPage';
import ActivityLogPage from './pages/staff/ActivityLogPage';
import StaffAccessDashboard from './pages/staff/StaffAccessDashboard';
import ConventionsPage from './pages/staff/ConventionsPage';
import MedecinsPrestatairesPage from './pages/staff/MedecinsPrestatairesPage';
import FacturesConventioneesPage from './pages/staff/FacturesConventioneesPage';
import HonorairesPage from './pages/staff/HonorairesPage';
import CommissionsPage from './pages/staff/CommissionsPage';
import ClotureCaissePage from './pages/staff/ClotureCaissePage';
import CaissePermanentePage from './pages/staff/CaissePermanentePage';
import HistoriqueCoturesPage from './pages/staff/HistoriqueCoturesPage';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <RBACProvider>
            <NotificationProvider>
              <WorkflowProvider>
                <Routes>
                <Route path="/" element={<PublicLayout />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/staff/login" element={<StaffLogin />} />
                <Route path="/staff/register" element={<StaffRegister />} />
                <Route path="/admin" element={<StaffLogin />} />
                <Route path="/register" element={<StaffRegister />} />
                <Route path="/admin-setup" element={<AdminSetupPage />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />

                <Route path="/dashboard" element={<RoleBasedRedirect />} />

                <Route path="/doctor/*" element={<DoctorRoutes />} />

                <Route path="/laboratory/*" element={<LaboratoryRoutes />} />

                <Route path="/pharmacy/*" element={<PharmacyRoutes />} />

                <Route path="/patient/*" element={<PatientRoutes />} />


                <Route
                  path="/tableau-de-bord"
                  element={
                    <ProtectedRoute>
                      <StaffLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DRCDashboard />} />
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="doctors-dashboard" element={<DoctorsDashboardPage />} />
                  <Route path="laboratory" element={<LaboratoryPage />} />
                  <Route path="laboratory/report-template" element={<LabReportTemplatePage />} />
                  <Route path="laboratory/report-template/:orderId" element={<LabReportTemplatePage />} />
                  <Route path="pharmacy" element={<PharmacyPage />} />
                  <Route path="administration" element={<AdministrationDashboard />} />
                  <Route path="admin-staff" element={<AdministrativeStaffPage />} />
                  <Route path="admin-tasks" element={<AdminTasksPage />} />
                  <Route path="admin-policies" element={<AdminPoliciesPage />} />
                  <Route path="admin-facilities" element={<AdminFacilitiesPage />} />
                  <Route path="admin-vendors" element={<AdminVendorsPage />} />
                  <Route path="employees" element={<EmployeesPage />} />
                  <Route path="payroll" element={<PayrollPage />} />
                  <Route path="shifts" element={<ShiftSchedulingPage />} />
                  <Route path="insurance" element={<InsurancePage />} />
                  <Route path="contracts" element={<ContractsPage />} />
                  <Route path="pharmacy-inventory" element={<Navigate to="/pharmacy/inventory" replace />} />
                  <Route path="exchange-rates" element={<ExchangeRatesPage />} />
                  <Route path="pending-registrations" element={<PendingRegistrationsPage />} />
                  <Route path="permission-management" element={<PermissionManagementPage />} />
                  <Route path="patient-flow" element={<PatientFlowDashboard />} />
                  <Route path="medical-consultation" element={<MedicalConsultationPage />} />
                  <Route path="medical-report" element={<MedicalReportPage />} />
                  <Route path="medical-report/:consultationId" element={<MedicalReportPage />} />
                  <Route path="profile" element={<StaffProfilePage />} />
                </Route>

                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute>
                      <StaffLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/staff/dashboard" replace />} />
                  <Route path="dashboard" element={<DRCDashboard />} />
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="doctors-dashboard" element={<DoctorsDashboardPage />} />
                  <Route path="laboratory" element={<LaboratoryPage />} />
                  <Route path="laboratory/report-template" element={<LabReportTemplatePage />} />
                  <Route path="laboratory/report-template/:orderId" element={<LabReportTemplatePage />} />
                  <Route path="radiology" element={<RadiologyPage />} />
                  <Route path="radiology/prescribe" element={<PrescribeExamPage />} />
                  <Route path="radiology/queue" element={<ExamQueuePage />} />
                  <Route path="radiology/workspace/:examId" element={<ExamWorkspacePage />} />
                  <Route path="radiology/viewer/:examId" element={<ReportViewerPage />} />
                  <Route path="radiology/history" element={<ExamHistoryPage />} />
                  <Route path="radiology/report-template" element={<ReportTemplatePage />} />
                  <Route path="radiology/report-template/:examId" element={<ReportTemplatePage />} />
                  <Route path="administration" element={<AdministrationDashboard />} />
                  <Route path="employees" element={<EmployeesPage />} />
                  <Route path="payroll" element={<PayrollPage />} />
                  <Route path="shift-scheduling" element={<ShiftSchedulingPage />} />
                  <Route path="insurance" element={<InsurancePage />} />
                  <Route path="contracts" element={<ContractsPage />} />
                  <Route path="pharmacy-inventory" element={<Navigate to="/pharmacy/inventory" replace />} />
                  <Route path="billing" element={<BillingPage />} />
                  <Route path="billing-analytics" element={<BillingAnalyticsPage />} />
                  <Route path="financial-analytics" element={<FinancialAnalytics />} />
                  <Route path="conventions" element={<ConventionsPage />} />
                  <Route path="factures-conventionnees" element={<FacturesConventioneesPage />} />
                  <Route path="honoraires" element={<HonorairesPage />} />
                  <Route path="commissions" element={<CommissionsPage />} />
                  <Route path="medecins-prestataires" element={<MedecinsPrestatairesPage />} />
                  <Route path="settings" element={<div className="text-center py-12 text-gray-500">Module Paramètres - En développement</div>} />
                  <Route path="drc-dashboard" element={<DRCDashboard />} />
                  <Route path="posts" element={<PostsManagementPage />} />
                  <Route path="unified-personnel" element={<UnifiedPersonnelPage />} />
                  <Route path="break-compliance" element={<Navigate to="/staff/smart-punch" replace />} />
                  <Route path="smart-punch" element={<SmartPunchPage />} />
                  <Route path="smart-punch-dashboard" element={<SmartPunchDashboard />} />
                  <Route path="logistics" element={<LogisticsPage />} />
                  <Route path="transport" element={<TransportManagementPage />} />
                  <Route path="facilities" element={<AdminFacilitiesPage />} />
                  <Route path="prescriptions" element={<PrescriptionsPage />} />
                  <Route path="pharmacy" element={<PharmacyPage />} />
                  <Route path="patient-checkin" element={<PatientCheckInPage />} />
                  <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
                  <Route path="suppliers" element={<SuppliersPage />} />
                  <Route path="expenses" element={<ExpenseManagementPage />} />
                  <Route path="sorties-caisse" element={<SortiesCaissePage />} />
                  <Route path="doctor-visibility" element={<DoctorVisibilityPage />} />
                  <Route path="role-management" element={<RoleManagementPage />} />
                  <Route path="okapia-connect" element={<OkapiaConnectPage />} />
                  <Route path="messaging" element={<MessagingPage />} />
                  <Route path="feedback" element={<FeedbackDashboard />} />
                  <Route path="caisse" element={<CaissePage />} />
                  <Route path="cloture-caisse" element={<ClotureCaissePage />} />
                  <Route path="caisse-permanente" element={<CaissePermanentePage />} />
                  <Route path="historique-clotures" element={<HistoriqueCoturesPage />} />
                  <Route path="medical-acts-pricing" element={<MedicalActsPricingPage />} />
                  <Route path="doctor-queue" element={<DoctorQueuePage />} />
                  <Route path="pending-registrations" element={<PendingRegistrationsPage />} />
                  <Route path="permission-management" element={<PermissionManagementPage />} />
                  <Route path="patient-flow" element={<PatientFlowDashboard />} />
                  <Route path="medical-consultation" element={<MedicalConsultationPage />} />
                  <Route path="medical-report" element={<MedicalReportPage />} />
                  <Route path="medical-report/:consultationId" element={<MedicalReportPage />} />
                  <Route path="exchange-rates" element={<ExchangeRatesPage />} />
                  <Route path="activity-log" element={<ActivityLogPage />} />
                  <Route path="staff-access" element={<StaffAccessDashboard />} />
                  <Route path="profile" element={<StaffProfilePage />} />
                </Route>

                <Route path="/access-denied" element={<AccessDenied />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </WorkflowProvider>
          </NotificationProvider>
          </RBACProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
