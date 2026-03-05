import { useRBAC } from '../contexts/RBACContext';

export function useRadiologyPermissions() {
  const { hasPermission } = useRBAC();

  return {
    canPrescribe: hasPermission('radiology_prescribe'),
    canPerformExams: hasPermission('radiology_perform_exams'),
    canUploadImages: hasPermission('radiology_upload_images'),
    canWriteReports: hasPermission('radiology_write_reports'),
    canValidateReports: hasPermission('radiology_validate_reports'),
    canViewAll: hasPermission('radiology_view_all'),
    hasFullControl: hasPermission('radiology_full_control'),
    canManageDepartment: hasPermission('manage_radiology_department'),
    canDeleteRecords: hasPermission('delete_radiology_records'),
    canManageEquipment: hasPermission('manage_imaging_equipment'),
    canManageSchedule: hasPermission('manage_exam_schedule'),
    isRadiologyStaff: hasPermission('radiology_perform_exams') || hasPermission('radiology_validate_reports'),
    hasAnyAccess: hasPermission('radiology_view_all') || hasPermission('radiology_prescribe')
  };
}
