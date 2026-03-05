import { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, Clock, AlertCircle, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Patient, IntakeForm } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

interface NewPatientRegistrationProps {
  patient: Patient;
  checkInId: string;
  queueNumber: string;
  onClose: () => void;
  onComplete: () => void;
}

export function NewPatientRegistration({
  patient,
  checkInId,
  queueNumber,
  onClose,
  onComplete,
}: NewPatientRegistrationProps) {
  const { profile } = useAuth();
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingAll, setCompletingAll] = useState(false);

  useEffect(() => {
    fetchForms();
  }, [checkInId]);

  async function fetchForms() {
    try {
      const { data, error } = await supabase
        .from('intake_forms')
        .select('*')
        .eq('checkin_id', checkInId)
        .order('is_required', { ascending: false })
        .order('form_type', { ascending: true });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFormCompletion(formId: string, isCompleted: boolean) {
    try {
      const updateData: any = {
        is_completed: !isCompleted,
      };

      if (!isCompleted) {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = profile?.id;
      } else {
        updateData.completed_at = null;
        updateData.completed_by = null;
      }

      const { error } = await supabase
        .from('intake_forms')
        .update(updateData)
        .eq('id', formId);

      if (error) throw error;

      setForms(forms.map(form =>
        form.id === formId
          ? { ...form, ...updateData }
          : form
      ));

      await checkAllFormsCompleted();
    } catch (error) {
      console.error('Error updating form:', error);
    }
  }

  async function checkAllFormsCompleted() {
    const allRequiredCompleted = forms
      .filter(f => f.is_required)
      .every(f => f.is_completed);

    if (allRequiredCompleted) {
      await supabase
        .from('patient_checkins')
        .update({
          intake_forms_completed: true,
          status: 'waiting',
        })
        .eq('id', checkInId);
    }
  }

  async function handleCompleteAll() {
    setCompletingAll(true);
    try {
      const completionTime = new Date().toISOString();

      await supabase
        .from('intake_forms')
        .update({
          is_completed: true,
          completed_at: completionTime,
          completed_by: profile?.id,
        })
        .eq('checkin_id', checkInId);

      await supabase
        .from('patient_checkins')
        .update({
          intake_forms_completed: true,
          status: 'waiting',
        })
        .eq('id', checkInId);

      fetchForms();
    } catch (error) {
      console.error('Error completing all forms:', error);
    } finally {
      setCompletingAll(false);
    }
  }

  function handlePrintForms() {
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Formulaires d'Inscription - ${patient.first_name} ${patient.last_name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .patient-info {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .label {
              font-weight: bold;
              color: #374151;
              display: block;
              margin-bottom: 5px;
            }
            .form-section {
              page-break-inside: avoid;
              margin-bottom: 40px;
              border: 2px solid #e5e7eb;
              padding: 20px;
              border-radius: 8px;
            }
            .form-title {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #2563eb;
            }
            .required {
              color: #dc2626;
              font-size: 12px;
              font-weight: normal;
              margin-left: 8px;
            }
            .form-field {
              margin-bottom: 20px;
            }
            .field-label {
              font-weight: 600;
              color: #374151;
              margin-bottom: 8px;
            }
            .field-line {
              border-bottom: 1px solid #000;
              min-height: 30px;
              margin-top: 5px;
            }
            .checkbox-group {
              margin-top: 10px;
            }
            .checkbox-item {
              margin: 8px 0;
              display: flex;
              align-items: center;
            }
            .checkbox {
              width: 18px;
              height: 18px;
              border: 2px solid #000;
              margin-right: 10px;
              display: inline-block;
            }
            .signature-section {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
            }
            .signature-line {
              border-bottom: 2px solid #000;
              min-height: 60px;
              margin-top: 30px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
            @media print {
              body { padding: 20px; }
              .form-section { page-break-after: always; }
              .form-section:last-child { page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">OKAPIA MÉDICAL</div>
            <p style="margin: 5px 0; color: #6b7280;">Formulaires d'Inscription Nouveau Patient</p>
            <p style="margin: 5px 0; color: #6b7280;">N° de File: <strong>${queueNumber}</strong></p>
          </div>

          <div class="patient-info">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Nom Complet:</span>
                ${patient.first_name} ${patient.last_name}
              </div>
              <div class="info-item">
                <span class="label">N° Patient:</span>
                ${patient.patient_number}
              </div>
              <div class="info-item">
                <span class="label">Date:</span>
                ${new Date().toLocaleDateString('fr-FR')}
              </div>
              <div class="info-item">
                <span class="label">Heure:</span>
                ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          ${forms.map((form, index) => `
            <div class="form-section">
              <h2 class="form-title">
                ${index + 1}. ${form.form_name}
                ${form.is_required ? '<span class="required">* OBLIGATOIRE</span>' : ''}
              </h2>

              ${form.form_type === 'personal_info' ? `
                <div class="form-field">
                  <div class="field-label">Nom complet:</div>
                  <div class="field-line"></div>
                </div>
                <div class="form-field">
                  <div class="field-label">Date de naissance:</div>
                  <div class="field-line"></div>
                </div>
                <div class="form-field">
                  <div class="field-label">Adresse complète:</div>
                  <div class="field-line"></div>
                  <div class="field-line"></div>
                </div>
                <div class="form-field">
                  <div class="field-label">Téléphone:</div>
                  <div class="field-line"></div>
                </div>
                <div class="form-field">
                  <div class="field-label">Email (optionnel):</div>
                  <div class="field-line"></div>
                </div>
              ` : ''}

              ${form.form_type === 'medical_history' ? `
                <div class="form-field">
                  <div class="field-label">Antécédents médicaux:</div>
                  <div class="field-line"></div>
                  <div class="field-line"></div>
                  <div class="field-line"></div>
                </div>
                <div class="form-field">
                  <div class="field-label">Allergies connues:</div>
                  <div class="field-line"></div>
                  <div class="field-line"></div>
                </div>
                <div class="form-field">
                  <div class="field-label">Maladies chroniques:</div>
                  <div class="field-line"></div>
                  <div class="field-line"></div>
                </div>
                <div class="form-field">
                  <div class="field-label">Médicaments actuels:</div>
                  <div class="field-line"></div>
                  <div class="field-line"></div>
                </div>
              ` : ''}

              ${form.form_type === 'insurance' ? `
                <div class="form-field">
                  <div class="field-label">Compagnie d'assurance:</div>
                  <div class="field-line"></div>
                </div>
                <div class="form-field">
                  <div class="field-label">Numéro de police:</div>
                  <div class="field-line"></div>
                </div>
                <div class="form-field">
                  <div class="field-label">Numéro de membre:</div>
                  <div class="field-line"></div>
                </div>
              ` : ''}

              ${form.form_type === 'consent' ? `
                <div class="checkbox-group">
                  <div class="checkbox-item">
                    <span class="checkbox"></span>
                    Je consens au traitement médical
                  </div>
                  <div class="checkbox-item">
                    <span class="checkbox"></span>
                    J'autorise le partage d'informations médicales nécessaires
                  </div>
                  <div class="checkbox-item">
                    <span class="checkbox"></span>
                    J'ai lu et compris les politiques de confidentialité
                  </div>
                </div>
              ` : ''}

              <div class="signature-section">
                <p><strong>Signature du patient (ou tuteur légal):</strong></p>
                <div class="signature-line"></div>
                <p style="margin-top: 10px;">Date: _____________________</p>
              </div>
            </div>
          `).join('')}

          <div class="footer">
            <p>OKAPIA Médical - Excellence en Soins de Santé</p>
            <p>Ces formulaires sont confidentiels et protégés par le secret médical</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  const allRequiredCompleted = forms.filter(f => f.is_required).every(f => f.is_completed);
  const completedCount = forms.filter(f => f.is_completed).length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des formulaires...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Inscription Nouveau Patient</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  Nouveau Patient - Formulaires d'Inscription Requis
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Puisque c'est la première visite de{' '}
                  <strong>{patient.first_name} {patient.last_name}</strong> à OKAPIA Médical,
                  veuillez diriger le patient vers la réception pour compléter les formulaires d'inscription.
                </p>
                <div className="flex items-center gap-2 text-sm text-yellow-700">
                  <Clock className="w-4 h-4" />
                  <span>Temps estimé: 10-15 minutes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-blue-900">Numéro de File d'Attente</p>
              <p className="text-2xl font-bold text-blue-700">{queueNumber}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Formulaires d'Inscription ({completedCount}/{forms.length} complétés)
              </h3>
              <button
                onClick={handlePrintForms}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer</span>
              </button>
            </div>

            <div className="space-y-3">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    form.is_completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => toggleFormCompletion(form.id, form.is_completed)}
                        className={`mt-1 w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${
                          form.is_completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {form.is_completed && <CheckCircle className="w-5 h-5 text-white" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className={`w-5 h-5 ${
                            form.is_completed ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <p className={`font-medium ${
                            form.is_completed ? 'text-green-900' : 'text-gray-900'
                          }`}>
                            {form.form_name}
                          </p>
                          {form.is_required && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              Obligatoire
                            </span>
                          )}
                        </div>
                        {form.is_completed && form.completed_at && (
                          <p className="text-xs text-gray-600 mt-1">
                            Complété à {new Date(form.completed_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!allRequiredCompleted && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Remarque:</strong> Tous les formulaires marqués "Obligatoire" doivent être complétés
                avant que le patient puisse être mis en file d'attente pour voir le médecin.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCompleteAll}
              disabled={completingAll}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {completingAll ? 'Traitement...' : 'Marquer Tous Complétés'}
            </button>
            <button
              onClick={onComplete}
              disabled={!allRequiredCompleted}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {allRequiredCompleted ? 'Continuer' : 'Compléter les Formulaires Obligatoires'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
