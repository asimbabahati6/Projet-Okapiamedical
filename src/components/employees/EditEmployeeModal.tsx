import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { Employee } from '../../types/drcClinic';
import { EmployeeFormData, StepNumber, ValidationError } from '../../types/employeeForm';
import { getEmployeeById, updateEmployee } from '../../services/employeeService';
import { useToast } from '../../hooks/useToast';
import { TabNavigation } from '../wizard/TabNavigation';
import { PersonalInfoStep } from '../wizard/steps/PersonalInfoStep';
import { AcademicBackgroundStep } from '../wizard/steps/AcademicBackgroundStep';
import { ContactDetailsStep } from '../wizard/steps/ContactDetailsStep';
import { ProfessionalInfoStep } from '../wizard/steps/ProfessionalInfoStep';
import { BankingInfoStep } from '../wizard/steps/BankingInfoStep';
import { EmergencyContactStep } from '../wizard/steps/EmergencyContactStep';
import { ReviewStep } from '../wizard/steps/ReviewStep';
import {
  validatePersonalInfo,
  validateAcademicBackground,
  validateContactDetails,
  validateProfessionalInfo,
  validateBankingInfo,
  validateEmergencyContact,
} from '../../validation/employeeValidation';

interface EditEmployeeModalProps {
  employee: Employee;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditEmployeeModal({ employee, onClose, onUpdate }: EditEmployeeModalProps) {
  const [currentTab, setCurrentTab] = useState<StepNumber>(1);
  const [formData, setFormData] = useState<EmployeeFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<number, ValidationError[]>>({});
  const { showToast } = useToast();

  useEffect(() => {
    loadEmployeeData();
  }, [employee.id]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const data = await getEmployeeById(employee.id);
      if (data) {
        setFormData(data);
      } else {
        showToast('Erreur lors du chargement des données', 'error');
        onClose();
      }
    } catch (error) {
      console.error('Error loading employee:', error);
      showToast('Erreur lors du chargement des données', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentTab = (tab: StepNumber): ValidationError[] => {
    if (!formData) return [];

    let errors: ValidationError[] = [];

    switch (tab) {
      case 1:
        errors = validatePersonalInfo(formData.personalInfo);
        break;
      case 2:
        errors = validateAcademicBackground(
          formData.academicBackground,
          formData.professionalInfo.hireDate
        );
        break;
      case 3:
        errors = validateContactDetails(formData.contactDetails);
        break;
      case 4:
        errors = validateProfessionalInfo(
          formData.professionalInfo,
          formData.personalInfo.dateOfBirth
        );
        break;
      case 5:
        errors = validateBankingInfo(formData.bankingInfo);
        break;
      case 6:
        errors = validateEmergencyContact(formData.emergencyContact);
        break;
      case 7:
        errors = [];
        break;
    }

    setStepErrors((prev) => ({ ...prev, [tab]: errors }));
    return errors;
  };

  const handleTabChange = (tab: StepNumber) => {
    validateCurrentTab(currentTab);
    setCurrentTab(tab);
  };

  const updateFormData = <K extends keyof EmployeeFormData>(
    section: K,
    data: Partial<EmployeeFormData[K]>
  ) => {
    if (!formData) return;

    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        ...data,
      },
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!formData) return;

    const allErrors: ValidationError[] = [];
    for (let i = 1; i <= 6; i++) {
      const errors = validateCurrentTab(i as StepNumber);
      allErrors.push(...errors);
    }

    if (allErrors.length > 0) {
      showToast('Veuillez corriger les erreurs avant de sauvegarder', 'error');
      return;
    }

    try {
      setSaving(true);
      const result = await updateEmployee(employee.id, formData);

      if (result.success) {
        showToast('Employé modifié avec succès', 'success');
        setHasChanges(false);
        onUpdate();
        onClose();
      } else {
        showToast(result.error || 'Erreur lors de la modification', 'error');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const tabErrorCounts = Object.entries(stepErrors).reduce((acc, [tab, errors]) => {
    acc[parseInt(tab)] = errors.length;
    return acc;
  }, {} as Record<number, number>);

  if (loading || !formData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Modifier l'Employé</h2>
            <p className="text-sm text-gray-600 mt-1">
              {formData.personalInfo.firstName} {formData.personalInfo.lastName} - {formData.personalInfo.employeeNumber}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <TabNavigation
          currentTab={currentTab}
          onTabChange={handleTabChange}
          tabErrors={tabErrorCounts}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {currentTab === 1 && (
            <PersonalInfoStep
              data={formData.personalInfo}
              onChange={(data) => updateFormData('personalInfo', data)}
              errors={stepErrors[1] || []}
            />
          )}

          {currentTab === 2 && (
            <AcademicBackgroundStep
              data={formData.academicBackground}
              onChange={(data) => updateFormData('academicBackground', data)}
              errors={stepErrors[2] || []}
            />
          )}

          {currentTab === 3 && (
            <ContactDetailsStep
              data={formData.contactDetails}
              onChange={(data) => updateFormData('contactDetails', data)}
              errors={stepErrors[3] || []}
            />
          )}

          {currentTab === 4 && (
            <ProfessionalInfoStep
              data={formData.professionalInfo}
              onChange={(data) => updateFormData('professionalInfo', data)}
              errors={stepErrors[4] || []}
            />
          )}

          {currentTab === 5 && (
            <BankingInfoStep
              data={formData.bankingInfo}
              onChange={(data) => updateFormData('bankingInfo', data)}
              errors={stepErrors[5] || []}
            />
          )}

          {currentTab === 6 && (
            <EmergencyContactStep
              data={formData.emergencyContact}
              onChange={(data) => updateFormData('emergencyContact', data)}
              errors={stepErrors[6] || []}
            />
          )}

          {currentTab === 7 && (
            <ReviewStep formData={formData} />
          )}
        </div>

        {Object.values(stepErrors).some((errors) => errors.length > 0) && (
          <div className="bg-red-50 border-t border-red-200 p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-medium">
                Il y a des erreurs dans le formulaire. Veuillez les corriger avant de sauvegarder.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={saving}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || Object.values(stepErrors).some((errors) => errors.length > 0)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
