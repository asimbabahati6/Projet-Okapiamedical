import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Loader2, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { useLabOrderActions } from '../../hooks/useLabOrderActions';
import { useAuth } from '../../contexts/AuthContext';
import { MultiSelectWithSearch } from '../ui/MultiSelectWithSearch';

interface AddLabOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole?: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  patient_number: string;
}

interface Doctor {
  id: string;
  full_name: string;
}

interface LabTest {
  id: string;
  test_name: string;
  test_code: string;
  category: string | null;
  price: number | null;
}

export function AddLabOrderModal({ onClose, onSuccess, currentUserRole }: AddLabOrderModalProps) {
  const { showToast } = useToast();
  const { validateCreate } = useLabOrderActions();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    test_ids: [] as string[],
    priority: 'normal',
    notes: '',
  });

  // Auto-populate doctor field for regular doctors
  const isDoctorRole = currentUserRole === 'doctor';
  const canEditDoctor = currentUserRole === 'medical_director' ||
                        currentUserRole === 'super_admin' ||
                        currentUserRole === 'directeur_general';

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-populate doctor if user is a doctor
  useEffect(() => {
    if (profile?.id && isDoctorRole && doctors.length > 0) {
      setFormData(prev => ({ ...prev, doctor_id: profile.id }));
    }
  }, [profile, isDoctorRole, doctors]);

  async function fetchData() {
    setFetchingData(true);
    try {
      // Fetch patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, patient_number')
        .order('last_name')
        .limit(100);

      if (patientsError) throw patientsError;
      if (patientsData) setPatients(patientsData);

      // Fetch doctors from medical_staff_extension
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('medical_staff_extension')
        .select('id, full_name')
        .order('full_name');

      if (doctorsError) {
        console.error('Error fetching doctors:', doctorsError);
        // Fallback to user_profiles if medical_staff_extension doesn't work
        const { data: fallbackDoctors } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .eq('is_medical_staff', true)
          .order('full_name');

        if (fallbackDoctors) setDoctors(fallbackDoctors);
      } else if (doctorsData) {
        setDoctors(doctorsData);
      }

      // Fetch active lab tests
      const { data: testsData, error: testsError } = await supabase
        .from('lab_tests')
        .select('id, test_name, test_code, category, price')
        .eq('is_active', true)
        .order('category')
        .order('test_name');

      if (testsError) throw testsError;
      if (testsData) setTests(testsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setFetchingData(false);
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.patient_id) {
      newErrors.patient_id = 'Veuillez sélectionner un patient';
    }

    if (!formData.doctor_id) {
      newErrors.doctor_id = 'Veuillez sélectionner un médecin prescripteur';
    }

    if (!formData.test_ids || formData.test_ids.length === 0) {
      newErrors.test_ids = 'Veuillez sélectionner au moins un test de laboratoire';
    }

    if (!formData.priority) {
      newErrors.priority = 'Veuillez sélectionner une priorité';
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Les notes ne peuvent pas dépasser 500 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation
    if (!validateForm()) {
      showToast('Veuillez corriger les erreurs du formulaire', 'error');
      return;
    }

    // RBAC validation
    const validation = validateCreate();
    if (!validation.success) {
      showToast('Vous n\'avez pas les permissions nécessaires', 'error');
      return;
    }

    setLoading(true);

    try {
      // Generate unique order number
      const timestamp = Date.now().toString().slice(-4);
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const orderNumber = `LAB-${dateStr}-${timestamp}`;

      // Create the lab order
      const { data: orderData, error: orderError } = await supabase
        .from('lab_orders')
        .insert([
          {
            order_number: orderNumber,
            patient_id: formData.patient_id,
            doctor_id: formData.doctor_id,
            priority: formData.priority,
            status: 'pending',
            notes: formData.notes || null,
          },
        ])
        .select('id')
        .single();

      if (orderError) throw orderError;

      // Insert all selected tests into lab_order_tests junction table
      const testInserts = formData.test_ids.map(testId => ({
        lab_order_id: orderData.id,
        test_id: testId,
      }));

      const { error: testsError } = await supabase
        .from('lab_order_tests')
        .insert(testInserts);

      if (testsError) throw testsError;

      // Success notification
      const testCount = formData.test_ids.length;
      showToast(
        `Demande créée avec succès: ${testCount} test${testCount > 1 ? 's' : ''} prescrit${testCount > 1 ? 's' : ''}`,
        'success'
      );

      // Trigger success callback to refresh dashboard
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating lab order:', error);

      // Handle specific errors
      if (error.code === '23503') {
        showToast('Erreur: référence invalide. Veuillez vérifier les données sélectionnées.', 'error');
      } else {
        showToast('Erreur lors de la création de l\'analyse', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.patient_number.toLowerCase().includes(searchLower) ||
      patient.first_name.toLowerCase().includes(searchLower) ||
      patient.last_name.toLowerCase().includes(searchLower)
    );
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'normal': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const characterCount = formData.notes.length;
  const characterLimit = 500;

  // Calculate total price for selected tests
  const selectedTests = tests.filter(test => formData.test_ids.includes(test.id));
  const totalPrice = selectedTests.reduce((sum, test) => sum + (test.price || 0), 0);

  // Prepare options for multi-select
  const testOptions = tests.map(test => ({
    id: test.id,
    label: test.test_name,
    description: test.test_code,
    metadata: test.price ? `$${test.price}` : undefined,
  }));

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nouvelle Demande d'Analyse</h2>
            <p className="text-sm text-gray-600 mt-1">Créer une nouvelle demande d'analyse de laboratoire</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Loading State */}
        {fetchingData ? (
          <div className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient <span className="text-red-500">*</span>
                </label>
                <select
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    errors.patient_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner un patient</option>
                  {filteredPatients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.patient_number} - {patient.first_name} {patient.last_name}
                    </option>
                  ))}
                </select>
                {errors.patient_id && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.patient_id}</span>
                  </div>
                )}
                {patients.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">Aucun patient disponible</p>
                )}
              </div>

              {/* Prescribing Doctor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Médecin Prescripteur <span className="text-red-500">*</span>
                </label>
                <select
                  name="doctor_id"
                  value={formData.doctor_id}
                  onChange={handleChange}
                  required
                  disabled={isDoctorRole && !canEditDoctor}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    errors.doctor_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${isDoctorRole && !canEditDoctor ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Sélectionner un médecin</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </option>
                  ))}
                </select>
                {isDoctorRole && !canEditDoctor && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Auto-rempli avec votre profil
                  </p>
                )}
                {errors.doctor_id && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.doctor_id}</span>
                  </div>
                )}
              </div>

              {/* Laboratory Tests - Multi-Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tests de Laboratoire <span className="text-red-500">*</span>
                </label>
                <MultiSelectWithSearch
                  options={testOptions}
                  selectedIds={formData.test_ids}
                  onChange={(selectedIds) => {
                    setFormData(prev => ({ ...prev, test_ids: selectedIds }));
                    if (errors.test_ids) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.test_ids;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Sélectionner un ou plusieurs tests"
                  searchPlaceholder="Rechercher un test..."
                  error={!!errors.test_ids}
                  disabled={tests.length === 0}
                />
                {errors.test_ids && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.test_ids}</span>
                  </div>
                )}
                {tests.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">Aucun test disponible</p>
                )}

                {/* Price Summary */}
                {selectedTests.length > 0 && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">
                          Coût Total Estimé
                        </span>
                      </div>
                      <span className="text-lg font-bold text-green-700">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedTests.map(test => (
                        <span
                          key={test.id}
                          className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-green-100"
                        >
                          {test.test_code}: ${test.price || 0}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Priority Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Niveau de Priorité <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`relative flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.priority === 'normal'
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value="normal"
                      checked={formData.priority === 'normal'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className={`font-semibold ${formData.priority === 'normal' ? 'text-blue-700' : 'text-gray-700'}`}>
                        Normal
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Délai standard</div>
                    </div>
                  </label>

                  <label
                    className={`relative flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.priority === 'urgent'
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                        : 'border-gray-300 hover:border-red-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value="urgent"
                      checked={formData.priority === 'urgent'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className={`font-semibold ${formData.priority === 'urgent' ? 'text-red-700' : 'text-gray-700'}`}>
                        Urgent
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Traitement prioritaire</div>
                    </div>
                  </label>
                </div>
                {errors.priority && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.priority}</span>
                  </div>
                )}
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes Cliniques
                  <span className="text-gray-400 text-xs ml-2">(Optionnel)</span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  maxLength={characterLimit}
                  placeholder="Contexte clinique, symptômes, raison de la demande..."
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none ${
                    errors.notes ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.notes && (
                    <div className="flex items-center gap-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.notes}</span>
                    </div>
                  )}
                  <span className={`text-xs ml-auto ${characterCount > characterLimit * 0.9 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {characterCount}/{characterLimit} caractères
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || tests.length === 0 || patients.length === 0 || formData.test_ids.length === 0}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Création en cours...' : `Créer la Demande${formData.test_ids.length > 0 ? ` (${formData.test_ids.length} test${formData.test_ids.length > 1 ? 's' : ''})` : ''}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
