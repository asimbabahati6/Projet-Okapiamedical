import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { RBACProvider } from './contexts/RBACContext';
import { PendingInvoicesProvider } from './contexts/PendingInvoicesContext';
import { NotificationProvider } from './core/contexts/NotificationContext';
import { WorkflowProvider } from './core/contexts/WorkflowContext';

import { PublicLayout } from './pages/public/PublicLayout';
import { FeedbackPage } from './pages/public/FeedbackPage';
import { StaffLogin } from './pages/staff/StaffLogin';
import { StaffRegister } from './pages/staff/StaffRegister';
import { StaffLayout } from './pages/staff/StaffLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleBasedRedirect } from './routes/RoleBasedRedirect';
import { DoctorRoutes } from './routes/DoctorRoutes';
import { LaboratoryRoutes } from './routes/LaboratoryRoutes';
import { PatientRoutes } from './routes/PatientRoutes';
import { PharmacyRoutes } from './routes/PharmacyRoutes';
import { RadiologyRoutes } from './routes/RadiologyRoutes';
import { AccessDenied } from './components/AccessDenied';
import AdminSetupPage from './pages/AdminSetupPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

import { Dashboard } from './pages/staff/Dashboard';
import { AppointmentsPage } from './pages/staff/AppointmentsPage';
import { ConsultationsPage } from './pages/staff/ConsultationsPage';
import { ConsultationHistoryPage } from './pages/staff/ConsultationHistoryPage';
import { PrescriptionsPage } from './pages/staff/PrescriptionsPage';
import { BillingPage } from './pages/staff/BillingPage';
import { BillingAnalyticsPage } from './pages/staff/BillingAnalyticsPage';
import { EmployeesPage } from './pages/staff/EmployeesPage';
import { PayrollPage } from './pages/staff/PayrollPage';
import { ShiftSchedulingPage } from './pages/staff/ShiftSchedulingPage';
import { InsurancePage } from './pages/staff/InsurancePage';
import { LaboratoryPage } from './pages/staff/LaboratoryPage';
import { EnhancedPharmacyPage } from './pages/staff/EnhancedPharmacyPage';
import { LogisticsPage } from './pages/staff/LogisticsPage';
import { PatientCheckInPage } from './pages/staff/PatientCheckInPage';
import { DocumentsPage } from './pages/staff/DocumentsPage';
import { FeedbackDashboard } from './pages/staff/FeedbackDashboard';
import { MedicalBookingSystem } from './components/booking/MedicalBookingSystem';

const PatientFlowDashboard = React.lazy(() => import('./pages/staff/PatientFlowDashboard'));
const DoctorsDashboardPage = React.lazy(() => import('./pages/staff/DoctorsDashboardPage'));
const DoctorQueuePage = React.lazy(() => import('./pages/staff/DoctorQueuePage'));
const DoctorVisibilityPage = React.lazy(() => import('./pages/staff/DoctorVisibilityPage'));
const RadiologyPage = React.lazy(() => import('./pages/staff/RadiologyPage'));
const PharmacyStockPage = React.lazy(() => import('./pages/staff/PharmacyStockPage'));
const PharmacyLowStockPage = React.lazy(() => import('./pages/staff/PharmacyLowStockPage'));
const PharmacyDispensationPage = React.lazy(() => import('./pages/staff/PharmacyDispensationPage'));
const ExpenseManagementPage = React.lazy(() => import('./pages/staff/ExpenseManagementPage'));
const SortiesCaissePage = React.lazy(() => import('./pages/staff/SortiesCaissePage'));
const CaissePage = React.lazy(() => import('./pages/staff/CaissePage'));
const CaissePermanentePage = React.lazy(() => import('./pages/staff/CaissePermanentePage'));
const ClotureCaissePage = React.lazy(() => import('./pages/staff/ClotureCaissePage'));
const HistoriqueCoturesPage = React.lazy(() => import('./pages/staff/HistoriqueCoturesPage'));
const FileEncaissementPage = React.lazy(() => import('./pages/staff/FileEncaissementPage'));
const MedicalActsPricingPage = React.lazy(() => import('./pages/staff/MedicalActsPricingPage'));
const MedecinsPrestatairesPage = React.lazy(() => import('./pages/staff/MedecinsPrestatairesPage'));
const ExchangeRatesPage = React.lazy(() => import('./pages/staff/ExchangeRatesPage'));
const ConventionsPage = React.lazy(() => import('./pages/staff/ConventionsPage'));
const HonorairesPage = React.lazy(() => import('./pages/staff/HonorairesPage'));
const CommissionsPage = React.lazy(() => import('./pages/staff/CommissionsPage'));
const FacturesConventionneesPage = React.lazy(() => import('./pages/staff/FacturesConventionneesPage'));
const SmartPunchPage = React.lazy(() => import('./pages/staff/SmartPunchPage'));
const SmartPunchDashboard = React.lazy(() => import('./pages/staff/SmartPunchDashboard'));
const BreakCompliancePage = React.lazy(() => import('./pages/staff/BreakCompliancePage'));
const SuppliersPage = React.lazy(() => import('./pages/staff/SuppliersPage'));
const TransportManagementPage = React.lazy(() => import('./pages/staff/TransportManagementPage'));
const AdministrationDashboard = React.lazy(() => import('./pages/staff/AdministrationDashboard'));
const AdministrativeStaffPage = React.lazy(() => import('./pages/staff/AdministrativeStaffPage'));
const AdminFacilitiesPage = React.lazy(() => import('./pages/staff/AdminFacilitiesPage'));
const AdminPoliciesPage = React.lazy(() => import('./pages/staff/AdminPoliciesPage'));
const AdminTasksPage = React.lazy(() => import('./pages/staff/AdminTasksPage'));
const AdminVendorsPage = React.lazy(() => import('./pages/staff/AdminVendorsPage'));
const MessagingPage = React.lazy(() => import('./pages/staff/MessagingPage'));
const FinancialAnalytics = React.lazy(() => import('./pages/finance/FinancialAnalytics'));
const ContractsPage = React.lazy(() => import('./pages/staff/hr/contracts/ContractsPage'));
const MedicalReportPage = React.lazy(() => import('./pages/staff/medical/MedicalReportPage'));
const ExamHistoryPage = React.lazy(() => import('./pages/staff/radiology/ExamHistoryPage'));
const ExamQueuePage = React.lazy(() => import('./pages/staff/radiology/ExamQueuePage'));
const PrescribeExamPage = React.lazy(() => import('./pages/staff/radiology/PrescribeExamPage'));
const ReportTemplatePage = React.lazy(() => import('./pages/staff/radiology/ReportTemplatePage'));
const PharmacyPrescriptionsPage = React.lazy(() => import('./pages/staff/pharmacy/PharmacyPrescriptionsPage'));
const PharmacyOrdersPage = React.lazy(() => import('./pages/staff/pharmacy/PharmacyOrdersPage'));
const PharmacyLowStockPageAlt = React.lazy(() => import('./pages/staff/pharmacy/PharmacyLowStockPage'));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LazyFallback />}>{children}</Suspense>;
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-700">{title}</h2>
        <p className="text-gray-500 text-sm mt-2">Cette page est en cours de developpement.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <RBACProvider>
            <NotificationProvider>
              <PendingInvoicesProvider>
                <WorkflowProvider>
                  <Routes>
                    {/* Public */}
                    <Route path="/" element={<PublicLayout />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/booking" element={<MedicalBookingSystem />} />

                    {/* Auth */}
                    <Route path="/staff/login" element={<StaffLogin />} />
                    <Route path="/staff/register" element={<StaffRegister />} />
                    <Route path="/admin-setup" element={<AdminSetupPage />} />
                    <Route path="/change-password" element={<ChangePasswordPage />} />
                    <Route path="/access-denied" element={<AccessDenied />} />
                    <Route path="/tableau-de-bord" element={<RoleBasedRedirect />} />

                    {/* Staff */}
                    <Route
                      path="/staff"
                      element={
                        <ProtectedRoute>
                          <StaffLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Navigate to="/staff/dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="appointments" element={<AppointmentsPage />} />
                      <Route path="medical-consultation" element={<ConsultationsPage />} />
                      <Route path="consultation-history" element={<ConsultationHistoryPage />} />
                      <Route path="prescriptions" element={<PrescriptionsPage />} />
                      <Route path="patient-flow" element={<Lazy><PatientFlowDashboard /></Lazy>} />
                      <Route path="patient-checkin" element={<PatientCheckInPage />} />
                      <Route path="doctors-dashboard" element={<Lazy><DoctorsDashboardPage /></Lazy>} />
                      <Route path="doctor-queue" element={<Lazy><DoctorQueuePage /></Lazy>} />
                      <Route path="doctor-visibility" element={<Lazy><DoctorVisibilityPage /></Lazy>} />
                      <Route path="laboratory" element={<LaboratoryPage />} />
                      <Route path="radiology" element={<Lazy><RadiologyPage /></Lazy>} />
                      <Route path="radiology/exam-history" element={<Lazy><ExamHistoryPage /></Lazy>} />
                      <Route path="radiology/exam-queue" element={<Lazy><ExamQueuePage /></Lazy>} />
                      <Route path="radiology/prescribe-exam" element={<Lazy><PrescribeExamPage /></Lazy>} />
                      <Route path="radiology/report-templates" element={<Lazy><ReportTemplatePage /></Lazy>} />
                      <Route path="pharmacy" element={<EnhancedPharmacyPage />} />
                      <Route path="pharmacy-stock" element={<Lazy><PharmacyStockPage /></Lazy>} />
                      <Route path="pharmacy-low-stock" element={<Lazy><PharmacyLowStockPage /></Lazy>} />
                      <Route path="pharmacy-dispensation" element={<Lazy><PharmacyDispensationPage /></Lazy>} />
                      <Route path="pharmacy/prescriptions" element={<Lazy><PharmacyPrescriptionsPage /></Lazy>} />
                      <Route path="pharmacy/orders" element={<Lazy><PharmacyOrdersPage /></Lazy>} />
                      <Route path="pharmacy/low-stock" element={<Lazy><PharmacyLowStockPageAlt /></Lazy>} />
                      <Route path="pharmacy-inventory" element={<Navigate to="/pharmacy/inventory" replace />} />
                      <Route path="file-encaissement" element={<Lazy><FileEncaissementPage /></Lazy>} />
                      <Route path="billing" element={<BillingPage />} />
                      <Route path="billing-analytics" element={<BillingAnalyticsPage />} />
                      <Route path="financial-analytics" element={<Lazy><FinancialAnalytics /></Lazy>} />
                      <Route path="expenses" element={<Lazy><ExpenseManagementPage /></Lazy>} />
                      <Route path="sorties-caisse" element={<Lazy><SortiesCaissePage /></Lazy>} />
                      <Route path="caisse" element={<Lazy><CaissePage /></Lazy>} />
                      <Route path="cloture-caisse" element={<Lazy><ClotureCaissePage /></Lazy>} />
                      <Route path="caisse-permanente" element={<Lazy><CaissePermanentePage /></Lazy>} />
                      <Route path="historique-clotures" element={<Lazy><HistoriqueCoturesPage /></Lazy>} />
                      <Route path="medical-acts-pricing" element={<Lazy><MedicalActsPricingPage /></Lazy>} />
                      <Route path="medecins-prestataires" element={<Lazy><MedecinsPrestatairesPage /></Lazy>} />
                      <Route path="exchange-rates" element={<Lazy><ExchangeRatesPage /></Lazy>} />
                      <Route path="conventions" element={<Lazy><ConventionsPage /></Lazy>} />
                      <Route path="factures-conventionnees" element={<Lazy><FacturesConventionneesPage /></Lazy>} />
                      <Route path="honoraires" element={<Lazy><HonorairesPage /></Lazy>} />
                      <Route path="commissions" element={<Lazy><CommissionsPage /></Lazy>} />
                      <Route path="insurance" element={<InsurancePage />} />
                      <Route path="employees" element={<EmployeesPage />} />
                      <Route path="unified-personnel" element={<EmployeesPage />} />
                      <Route path="payroll" element={<PayrollPage />} />
                      <Route path="contracts" element={<Lazy><ContractsPage /></Lazy>} />
                      <Route path="shift-scheduling" element={<ShiftSchedulingPage />} />
                      <Route path="smart-punch-dashboard" element={<Lazy><SmartPunchDashboard /></Lazy>} />
                      <Route path="smart-punch" element={<Lazy><SmartPunchPage /></Lazy>} />
                      <Route path="break-compliance" element={<Lazy><BreakCompliancePage /></Lazy>} />
                      <Route path="logistics" element={<LogisticsPage />} />
                      <Route path="suppliers" element={<Lazy><SuppliersPage /></Lazy>} />
                      <Route path="purchase-orders" element={<PlaceholderPage title="Bons de Commande" />} />
                      <Route path="transport" element={<Lazy><TransportManagementPage /></Lazy>} />
                      <Route path="facilities" element={<Lazy><AdminFacilitiesPage /></Lazy>} />
                      <Route path="administration" element={<Lazy><AdministrationDashboard /></Lazy>} />
                      <Route path="administrative-staff" element={<Lazy><AdministrativeStaffPage /></Lazy>} />
                      <Route path="admin-policies" element={<Lazy><AdminPoliciesPage /></Lazy>} />
                      <Route path="admin-tasks" element={<Lazy><AdminTasksPage /></Lazy>} />
                      <Route path="admin-vendors" element={<Lazy><AdminVendorsPage /></Lazy>} />
                      <Route path="documents" element={<DocumentsPage />} />
                      <Route path="medical-report/:consultationId" element={<Lazy><MedicalReportPage /></Lazy>} />
                      <Route path="messaging" element={<Lazy><MessagingPage /></Lazy>} />
                      <Route path="okapia-connect" element={<Lazy><MessagingPage /></Lazy>} />
                      <Route path="feedback" element={<FeedbackDashboard />} />
                      <Route path="posts" element={<PlaceholderPage title="Publications" />} />
                      <Route path="pending-registrations" element={<PlaceholderPage title="Inscriptions en attente" />} />
                      <Route path="role-management" element={<PlaceholderPage title="Gestion des Roles" />} />
                      <Route path="permission-management" element={<PlaceholderPage title="Gestion des Permissions" />} />
                      <Route path="activity-log" element={<PlaceholderPage title="Journal d'activite" />} />
                      <Route path="staff-access" element={<PlaceholderPage title="Acces du personnel" />} />
                    </Route>

                    {/* Admin redirect */}
                    <Route path="/admin/dashboard" element={<Navigate to="/staff/dashboard" replace />} />
                    <Route path="/admin/*" element={<Navigate to="/staff/dashboard" replace />} />

                    {/* Module routes */}
                    <Route path="/doctor/*" element={<DoctorRoutes />} />
                    <Route path="/laboratory/*" element={<LaboratoryRoutes />} />
                    <Route path="/patient/*" element={<PatientRoutes />} />
                    <Route path="/pharmacy/*" element={<PharmacyRoutes />} />
                    <Route path="/radiology/*" element={<RadiologyRoutes />} />

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </WorkflowProvider>
              </PendingInvoicesProvider>
            </NotificationProvider>
          </RBACProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
