import { useState, useEffect } from 'react';
import { X, Search, User, UserPlus, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface AssignDoctorToPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  social_security_number: string;
  phone: string;
  primary_care_physician_id: string | null;
  physician_name: string | null;
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  patient_count: number;
}

export default function AssignDoctorToPatientModal({ isOpen, onClose, onSuccess }: AssignDoctorToPatientModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [assignmentType, setAssignmentType] = useState<'permanent' | 'temporary'>('permanent');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchPatients();
    } else {
      setPatients([]);
    }
  }, [searchTerm]);

  async function searchPatients() {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          first_name,
          last_name,
          date_of_birth,
          social_security_number,
          phone,
          primary_care_physician_id,
          user_profiles!patients_primary_care_physician_id_fkey (
            first_name,
            last_name
          )
        `)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,social_security_number.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      const formattedPatients = data.map((p: any) => ({
        ...p,
        physician_name: p.user_profiles
          ? `Dr. ${p.user_profiles.first_name} ${p.user_profiles.last_name}`
          : null
      }));

      setPatients(formattedPatients);
    } catch (error) {
      console.error('Error searching patients:', error);
      showToast('Erreur lors de la recherche de patients', 'error');
    } finally {
      setSearching(false);
    }
  }

  async function fetchDoctors() {
    try {
      const { data, error } = await supabase
        .from('medical_staff')
        .select(`
          user_id,
          first_name,
          last_name,
          specialization
        `)
        .eq('staff_type', 'doctor')
        .eq('employment_status', 'active')
        .order('last_name');

      if (error) throw error;

      const doctorsWithCount = await Promise.all(
        data.map(async (doc) => {
          const { count } = await supabase
            .from('patients')
            .select('id', { count: 'exact', head: true })
            .eq('primary_care_physician_id', doc.user_id);

          return {
            id: doc.user_id,
            first_name: doc.first_name,
            last_name: doc.last_name,
            specialization: doc.specialization,
            patient_count: count || 0
          };
        })
      );

      setDoctors(doctorsWithCount);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      showToast('Erreur lors du chargement des médecins', 'error');
    }
  }

  async function handleAssign() {
    if (!selectedPatient || !selectedDoctorId) {
      showToast('Veuillez sélectionner un patient et un médecin', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          primary_care_physician_id: selectedDoctorId,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPatient.id);

      if (error) throw error;

      const doctor = doctors.find(d => d.id === selectedDoctorId);
      if (doctor) {
        await supabase.from('patient_audit_log').insert({
          patient_id: selectedPatient.id,
          action_type: 'physician_assigned',
          action_details: {
            doctor_name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
            assignment_type: assignmentType,
            notes: notes
          }
        });
      }

      showToast('Médecin assigné avec succès', 'success');
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error assigning doctor:', error);
      showToast('Erreur lors de l\'assignation', 'error');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSearchTerm('');
    setPatients([]);
    setSelectedPatient(null);
    setSelectedDoctorId('');
    setAssignmentType('permanent');
    setNotes('');
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Affecter un Médecin à un Patient</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher un patient
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nom, prénom ou numéro de sécurité sociale..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {searching && (
              <div className="mt-2 text-sm text-gray-500">Recherche en cours...</div>
            )}

            {patients.length > 0 && (
              <div className="mt-2 border rounded-lg divide-y max-h-60 overflow-y-auto">
                {patients.map(patient => (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                      selectedPatient?.id === patient.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          NSS: {patient.social_security_number} • Tél: {patient.phone}
                        </div>
                        {patient.physician_name && (
                          <div className="text-xs text-orange-600 mt-1">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            Médecin actuel: {patient.physician_name}
                          </div>
                        )}
                      </div>
                      {selectedPatient?.id === patient.id && (
                        <User className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchTerm.length >= 2 && patients.length === 0 && !searching && (
              <div className="mt-2 text-sm text-gray-500">Aucun patient trouvé</div>
            )}
          </div>

          {selectedPatient && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Patient sélectionné</h3>
                <div className="text-sm text-blue-800">
                  <p><strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong></p>
                  <p>NSS: {selectedPatient.social_security_number}</p>
                  <p>Date de naissance: {new Date(selectedPatient.date_of_birth).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un médecin référent <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choisir un médecin...</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization} ({doctor.patient_count} patients)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'affectation
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="permanent"
                      checked={assignmentType === 'permanent'}
                      onChange={() => setAssignmentType('permanent')}
                      className="mr-2"
                    />
                    <span className="text-sm">Suivi permanent</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="temporary"
                      checked={assignmentType === 'temporary'}
                      onChange={() => setAssignmentType('temporary')}
                      className="mr-2"
                    />
                    <span className="text-sm">Suivi temporaire</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Raison de l'affectation, conditions particulières..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAssign}
              disabled={loading || !selectedPatient || !selectedDoctorId}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Assignation...' : 'Assigner le Médecin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
