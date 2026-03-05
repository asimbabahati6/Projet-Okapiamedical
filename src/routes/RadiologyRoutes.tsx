import { Routes, Route, Navigate } from 'react-router-dom';
import RadiologyLayout from '../modules/radiology/RadiologyLayout';
import RadiologyDashboard from '../modules/radiology/pages/RadiologyDashboard';
import ExamQueue from '../modules/radiology/pages/ExamQueue';
import ExamWorkspace from '../modules/radiology/pages/ExamWorkspace';
import ReportViewer from '../modules/radiology/pages/ReportViewer';
import { AccessControl } from '../components/common/AccessControl';

export function RadiologyRoutes() {
  return (
    <Routes>
      <Route element={<RadiologyLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route
          path="dashboard"
          element={
            <AccessControl
              permission="radiology_view_all"
              mode="redirect"
              redirectTo="/staff/dashboard"
            >
              <RadiologyDashboard />
            </AccessControl>
          }
        />

        <Route
          path="queue"
          element={
            <AccessControl
              permission="radiology_view_all"
              mode="redirect"
              redirectTo="/staff/dashboard"
            >
              <ExamQueue />
            </AccessControl>
          }
        />

        <Route
          path="workspace/:examId"
          element={
            <AccessControl
              permission={['radiology_perform_exams', 'radiology_validate_reports']}
              mode="redirect"
              redirectTo="/staff/dashboard"
            >
              <ExamWorkspace />
            </AccessControl>
          }
        />

        <Route
          path="viewer/:reportId"
          element={
            <AccessControl
              permission="radiology_view_all"
              mode="redirect"
              redirectTo="/staff/dashboard"
            >
              <ReportViewer />
            </AccessControl>
          }
        />

        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
