import { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { MultipleDiagnosesInput, DiagnosisInput } from './MultipleDiagnosesInput';
import { TemplateSelector } from './TemplateSelector';
import { ConsultationTemplate } from '../../types/database';

interface EnhancedAddConsultationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialPatientId?: string;
  initialAppointmentId?: string;
}

export function EnhancedAddConsultationModal({
  onClose,
  onSuccess,
  initialPatientId,
  initialAppointmentId
}: EnhancedAddConsultationModalProps) {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisInput[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ConsultationTemplate | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);

  const [formData, setFormData] = useState({
    patient_id: initialPatientId || '',
    appointment_id: initialAppointmentId || '',
    consultation_status: 'draft' as 'draft' | 'in_progress' | 'completed',
    consultation_type: 'routine' as 'initial' | 'follow_up' | 'emergency' | 'routine' | 'telemedicine',
    chief_complaint: '',
    history_of_present_illness: '',
    physical_examination: '',
    treatment_plan: '',
    notes: '',
    follow_up_date: '',
    temperature: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    respiratory_rate: '',
    weight: '',
    height: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      applyTemplate(selectedTemplate);
    }
  }, [selectedTemplate]);

  async function fetchData() {
    try {
      const [patientsResult, appointmentsResult] = await Promise.all([
        supabase
          .from('patients')
          .select('id, first_name, last_name, patient_number')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('appointments')
          .select('id, appointment_number, patient_id, status, department_id')
          .in('status', ['confirmed', 'in_progress'])
          .order('appointment_date', { ascending: false })
          .limit(50),
      ]);

      if (patientsResult.data) setPatients(patientsResult.data);
      if (appointmentsResult.data) setAppointments(appointmentsResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  function applyTemplate(template: ConsultationTemplate) {
    setFormData(prev => ({
      ...prev,
      chief_complaint: template.chief_complaint_template || prev.chief_complaint,
      history_of_present_illness: template.history_template || prev.history_of_present_illness,
      physical_examination: template.examination_template || prev.physical_examination,
      treatment_plan: template.treatment_template || prev.treatment_plan,
      notes: template.notes_template || prev.notes,
      ...(template.vital_signs_defaults || {})
    }));

    // Apply suggested diagnoses if available
    if (template.suggested_diagnoses && template.suggested_diagnoses.length > 0) {
      const suggestedDiagnoses: DiagnosisInput[] = template.suggested_diagnoses.map((diag, index) => ({
        id: crypto.randomUUID(),
        code: diag.code,
        description: diag.description,
        isFreeText: false,
        isPrimary: index === 0,
        notes: ''
      }));
      setDiagnoses(suggestedDiagnoses);
    }

    setShowTemplateSelector(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (diagnoses.length === 0) {
      showToast('Au moins un diagnostic est requis', 'error');
      return;
    }

    setLoading(true);

    try {
      const vitalSigns = {
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
        blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
        respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseInt(formData.height) : null,
      };

      // Create consultation
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .insert([
          {
            patient_id: formData.patient_id,
            doctor_id: profile?.id,
            appointment_id: formData.appointment_id || null,
            consultation_date: new Date().toISOString(),
            consultation_status: formData.consultation_status,
            consultation_type: formData.consultation_type,
            chief_complaint: formData.chief_complaint,
            history_of_present_illness: formData.history_of_present_illness,
            physical_examination: formData.physical_examination,
            treatment_plan: formData.treatment_plan,
            notes: formData.notes,
            follow_up_date: formData.follow_up_date || null,
            vital_signs: vitalSigns,
            template_used_id: selectedTemplate?.id || null,
          },
        ])
        .select()
        .single();

      if (consultationError) throw consultationError;

      // Create diagnoses
      const diagnosesData = diagnoses.map((diag, index) => ({
        consultation_id: consultation.id,
        icd10_code_id: diag.icd10_code_id || null,
        icd10_code: !diag.isFreeText ? diag.code : null,
        icd10_description: !diag.isFreeText ? diag.description : null,
        free_text_diagnosis: diag.isFreeText ? diag.description : null,
        is_primary: diag.isPrimary,
        diagnosis_order: index,
        notes: diag.notes || null,
        created_by: profile?.id,
      }));

      const { error: diagnosesError } = await supabase
        .from('consultation_diagnoses')
        .insert(diagnosesData);

      if (diagnosesError) throw diagnosesError;

      // Update template usage count if a template was used
      if (selectedTemplate) {
        await supabase
          .from('consultation_templates')
          .update({
            usage_count: (selectedTemplate.usage_count || 0) + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', selectedTemplate.id);
      }

      showToast('Consultation créée avec succès', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating consultation:', error);
      showToast('Erreur lors de la création de la consultation', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  const calculateBMI = () => {
    const weight = parseFloat(formData.weight);
    const height = parseInt(formData.height) / 100; // Convert cm to m
    if (weight > 0 && height > 0) {
      return (weight / (height * height)).toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Nouvelle Consultation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {showTemplateSelector && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <TemplateSelector
                  onSelect={(template) => setSelectedTemplate(template)}
                  selectedTemplateId={selectedTemplate?.id}
                  departmentId={profile?.department_id}
                />
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de Base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.patient_number} - {patient.first_name} {patient.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rendez-vous (optionnel)
                  </label>
                  <select
                    name="appointment_id"
                    value={formData.appointment_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Aucun</option>
                    {appointments.map(appointment => (
                      <option key={appointment.id} value={appointment.id}>
                        {appointment.appointment_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de Consultation <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="consultation_type"
                    value={formData.consultation_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="routine">Routine</option>
                    <option value="initial">Première consultation</option>
                    <option value="follow_up">Suivi</option>
                    <option value="emergency">Urgence</option>
                    <option value="telemedicine">Télémédecine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="consultation_status"
                    value={formData.consultation_status}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminée</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Motif de Consultation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plainte Principale <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="chief_complaint"
                    value={formData.chief_complaint}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Fièvre et maux de tête"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Histoire de la Maladie Actuelle
                  </label>
                  <textarea
                    name="history_of_present_illness"
                    value={formData.history_of_present_illness}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Décrivez l'évolution des symptômes..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Signes Vitaux</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Température (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    placeholder="37.0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TA Systolique
                  </label>
                  <input
                    type="number"
                    name="blood_pressure_systolic"
                    value={formData.blood_pressure_systolic}
                    onChange={handleChange}
                    placeholder="120"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TA Diastolique
                  </label>
                  <input
                    type="number"
                    name="blood_pressure_diastolic"
                    value={formData.blood_pressure_diastolic}
                    onChange={handleChange}
                    placeholder="80"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fréquence Cardiaque
                  </label>
                  <input
                    type="number"
                    name="heart_rate"
                    value={formData.heart_rate}
                    onChange={handleChange}
                    placeholder="72"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fréquence Respiratoire
                  </label>
                  <input
                    type="number"
                    name="respiratory_rate"
                    value={formData.respiratory_rate}
                    onChange={handleChange}
                    placeholder="16"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poids (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="70"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taille (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="170"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {bmi && (
                  <div className="flex items-center">
                    <div className="w-full px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs text-blue-700 font-medium mb-1">IMC</div>
                      <div className="text-lg font-bold text-blue-900">{bmi}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Examen Physique</h3>
              <textarea
                name="physical_examination"
                value={formData.physical_examination}
                onChange={handleChange}
                rows={4}
                placeholder="Résultats de l'examen physique..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <MultipleDiagnosesInput
                diagnoses={diagnoses}
                onChange={setDiagnoses}
                required={true}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan de Traitement</h3>
              <textarea
                name="treatment_plan"
                value={formData.treatment_plan}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Médicaments, procédures, recommandations..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Suivi (optionnel)
              </label>
              <input
                type="date"
                name="follow_up_date"
                value={formData.follow_up_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes Additionnelles
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Autres observations..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || diagnoses.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer la Consultation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
