import { useRBAC } from '../contexts/RBACContext';

export function useRadiologyPermissions() {
  const { hasPermission, userRole } = useRBAC();

  const isLabTech = userRole === 'laboratory';

  return {
    // Prescrire un examen (médecin)
    canPrescribe: hasPermission('radiology.prescribe'),

    // Réaliser les examens (radio_tech, radio_chef)
    canPerformExams: hasPermission('radiology.perform_exams'),

    // Télécharger les images DICOM
    canUploadImages: hasPermission('radiology.upload_images'),

    // Rédiger les comptes-rendus
    canWriteReports: hasPermission('radiology.write_reports'),

    // Valider les comptes-rendus (radio_chef, médecin directeur)
    canValidateReports: hasPermission('radiology.validate_reports'),

    // Vue globale du module
    canViewAll: hasPermission('radiology.view'),

    // Technicien labo : voir les examens radio liés à un dossier patient
    canViewExams: hasPermission('radiology.view') || isLabTech,

    // Contrôle total (admin, directeur)
    hasFullControl: hasPermission('radiology.validate_reports') && hasPermission('radiology.view'),

    // Gestion du département
    canManageDepartment: hasPermission('radiology.validate_reports'),

    // Équipements et planning
    canManageEquipment: hasPermission('radiology.perform_exams'),
    canManageSchedule: hasPermission('radiology.perform_exams'),

    // Suppression (admin seulement)
    canDeleteRecords: hasPermission('radiology.view') && (userRole === 'admin' || userRole === 'directeur_general'),

    // Est du staff radiologie
    isRadiologyStaff: hasPermission('radiology.perform_exams') || hasPermission('radiology.validate_reports'),

    // Accès quelconque
    hasAnyAccess: hasPermission('radiology.view') || hasPermission('radiology.prescribe'),
  };
}