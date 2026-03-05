import { useEffect, useState } from 'react';
import { X, Save, ChevronLeft, ChevronRight, Check, Loader2, FolderOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEmployeeWizard } from '../../hooks/useEmployeeWizard';
import { useDraftManagement } from '../../hooks/useDraftManagement';
import { StepIndicator } from './StepIndicator';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { AcademicBackgroundStep } from './steps/AcademicBackgroundStep';
import { ContactDetailsStep } from './steps/ContactDetailsStep';
import { ProfessionalInfoStep } from './steps/ProfessionalInfoStep';
import { BankingInfoStep } from './steps/BankingInfoStep';
import { EmergencyContactStep } from './steps/EmergencyContactStep';
import { ReviewStep } from './steps/ReviewStep';
import { createEmployee, generateUniqueEmployeeNumber } from '../../services/employeeService';
import { validateCompleteForm } from '../../validation/employeeValidation';

interface AddEmployeeWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddEmployeeWizard({ onClose, onSuccess }: AddEmployeeWizardProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  const {
    currentStep,
    formData,
    completedSteps,
    updateFormData,
    validateStep,
    nextStep,
    previousStep,
    goToStep,
    resetForm,
    loadFormData,
    getStepErrors,
  } = useEmployeeWizard();

  const {
    isSaving,
    lastSaved,
    saveDraft,
    publishDraft,
  } = useDraftManagement(formData, currentStep, completedSteps, user?.id);

  useEffect(() => {
    initializeEmployeeNumber();
  }, []);

  async function initializeEmployeeNumber() {
    try {
      const employeeNumber = await generateUniqueEmployeeNumber();
      updateFormData('personalInfo', { employeeNumber });
    } catch (error) {
      console.error('Error generating employee number:', error);
    }
  }

  const errorCounts: Record<number, number> = {
    1: getStepErrors(1).length,
    2: getStepErrors(2).length,
    3: getStepErrors(3).length,
    4: getStepErrors(4).length,
    5: getStepErrors(5).length,
    6: getStepErrors(6).length,
    7: 0,
  };

  async function handleSaveDraft() {
    const result = await saveDraft(draftName || undefined);
    if (result.success) {
      alert('Brouillon sauvegardé avec succès');
      setShowSaveModal(false);
      setDraftName('');
    } else {
      alert(`Erreur: ${result.error}`);
    }
  }

  async function handleSubmit() {
    const allErrors = validateCompleteForm(formData);

    if (allErrors.length > 0) {
      alert('Veuillez corriger toutes les erreurs avant de soumettre le formulaire');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createEmployee(formData);

      if (result.success) {
        await publishDraft();
        alert('Employé créé avec succès!');
        resetForm();
        onSuccess();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (formData.personalInfo.firstName || formData.contactDetails.professionalEmail) {
      setShowCloseConfirmation(true);
    } else {
      onClose();
    }
  }

  function renderCurrentStep() {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            data={formData.personalInfo}
            onChange={(data) => updateFormData('personalInfo', data)}
            errors={getStepErrors(1)}
          />
        );
      case 2:
        return (
          <AcademicBackgroundStep
            data={formData.academicBackground}
            onChange={(data) => updateFormData('academicBackground', data)}
            errors={getStepErrors(2)}
          />
        );
      case 3:
        return (
          <ContactDetailsStep
            data={formData.contactDetails}
            onChange={(data) => updateFormData('contactDetails', data)}
            errors={getStepErrors(3)}
          />
        );
      case 4:
        return (
          <ProfessionalInfoStep
            data={formData.professionalInfo}
            onChange={(data) => updateFormData('professionalInfo', data)}
            errors={getStepErrors(4)}
          />
        );
      case 5:
        return (
          <BankingInfoStep
            data={formData.bankingInfo}
            onChange={(data) => updateFormData('bankingInfo', data)}
            errors={getStepErrors(5)}
          />
        );
      case 6:
        return (
          <EmergencyContactStep
            data={formData.emergencyContact}
            onChange={(data) => updateFormData('emergencyContact', data)}
            errors={getStepErrors(6)}
          />
        );
      case 7:
        return <ReviewStep data={formData} onEditStep={goToStep} />;
      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ajouter un Employé</h2>
            {lastSaved && (
              <p className="text-xs text-gray-500 mt-1">
                Dernière sauvegarde: {new Date(lastSaved).toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sauvegarde...
              </span>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <StepIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={goToStep}
          errorCounts={errorCounts}
        />

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {renderCurrentStep()}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={previousStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Précédent
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Save className="w-5 h-5" />
                Enregistrer Brouillon
              </button>

              {currentStep < 7 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Suivant
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Créer l'Employé
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Enregistrer le Brouillon</h3>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Nom du brouillon (optionnel)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirmer la fermeture</h3>
            <p className="text-gray-600 mb-4">
              Des modifications non sauvegardées seront perdues. Souhaitez-vous continuer?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCloseConfirmation(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  await saveDraft();
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enregistrer et Fermer
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Quitter sans Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
