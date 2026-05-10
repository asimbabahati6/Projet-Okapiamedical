import { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, UserCheck, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { checkPatientStatus, getReceptionists, getRoutingType } from '../../utils/patientRouting';
import { PatientStatus } from '../../types/database';

interface AddAppointmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAppointmentModal({ onClose, onSuccess }: AddAppointmentModalProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [receptionists, setReceptionists] = useState<any[]>([]);
  const [patientStatus, setPatientStatus] = useState<PatientStatus | null>(null);
  const [checkingPatientStatus, setCheckingPatientStatus] = useState(false);
  const [showManualOverride, setShowManualOverride] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'in-person' as 'in-person' | 'telemedicine',
    reason: '',
    notes: '',
    routing_notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchReceptionists();
  }, []);

  useEffect(() => {
    if (formData.patient_id) {
      handlePatientChange(formData.patient_id);
    }
  }, [formData.patient_id]);

  async function fetchPatients() {
    try {
      const { data } = await supabase
        .from('patients')
        .select('id, patient_number, first_name, last_name, primary_care_physician_id')
        .order('first_name', { ascending: true })
        .limit(100);

      if (data) setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  }

  async function fetchDoctors() {
    try {
      const { data } = await supabase
        .from('medical_staff')
        .select('id, user_profile:user_profiles(id, full_name, role:roles(name)), specialization, is_accepting_patients')
        .eq('is_accepting_patients', true)
        .limit(50);

      if (data) setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  }

  async function fetchReceptionists() {
    try {
      const receptionistsList = await getReceptionists();
      setReceptionists(receptionistsList);
    } catch (error) {
      console.error('Error fetching receptionists:', error);
    }
  }

  async function handlePatientChange(patientId: string) {
    if (!patientId) {
      setPatientStatus(null);
      setFormData(prev => ({ ...prev, doctor_id: '' }));
      return;
    }

    setCheckingPatientStatus(true);
    try {
      const status = await checkPatientStatus(patientId);
      setPatientStatus(status);

      if (status.isNewPatient) {
        if (receptionists.length > 0) {
          setFormData(prev => ({
            ...prev,
            doctor_id: receptionists[0].id
          }));
        } else {
          setError('Aucun réceptionniste disponible. Veuillez contacter un administrateur.');
        }
      } else if (status.primaryCarePhysicianId) {
        setFormData(prev => ({
          ...prev,
          doctor_id: status.primaryCarePhysicianId!
        }));
      } else {
        setError('Ce patient n\'a pas de médecin traitant assigné. Veuillez en sélectionner un.');
      }
    } catch (error) {
      console.error('Error checking patient status:', error);
      setError('Erreur lors de la vérification du statut du patient');
    } finally {
      setCheckingPatientStatus(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!patientStatus) {
        throw new Error('Statut du patient non déterminé');
      }

      const appointmentNumber = `APT${Date.now().toString().slice(-8)}`;

      const routingType = getRoutingType(
        patientStatus.isNewPatient,
        showManualOverride,
        !!patientStatus.primaryCarePhysicianId
      );

      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          appointment_number: appointmentNumber,
          patient_id: formData.patient_id,
          doctor_id: formData.doctor_id,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          appointment_type: formData.appointment_type,
          reason: formData.reason,
          notes: formData.notes || null,
          routing_type: routingType,
          routing_notes: showManualOverride ? formData.routing_notes : null,
          is_new_patient_appointment: patientStatus.isNewPatient,
          status: 'pending',
          estimated_duration: 30,
          preferred_language: 'fr',
        });

      if (insertError) throw insertError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const isDoctorFieldLocked = patientStatus && !showManualOverride && (
    patientStatus.isNewPatient ||
    !!patientStatus.primaryCarePhysicianId
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Nouveau Rendez-vous</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient *
                </label>
                <select
                  required
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={checkingPatientStatus}
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} ({patient.patient_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Médecin *
                </label>
                <select
                  required
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isDoctorFieldLocked || checkingPatientStatus}
                >
                  <option value="">Sélectionner un médecin</option>
                  {(patientStatus?.isNewPatient && !showManualOverride ? receptionists : doctors).map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.user_profile?.full_name || doctor.full_name}
                      {doctor.specialization && ` - ${doctor.specialization}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {patientStatus && (
              <div className={`p-3 rounded-lg border flex items-center gap-3 ${
                patientStatus.isNewPatient
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                {patientStatus.isNewPatient ? (
                  <>
                    <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900">NOUVEAU PATIENT</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Ce patient sera automatiquement dirigé vers la réception pour traitement initial.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900">PATIENT EXISTANT</p>
                      <p className="text-xs text-green-700 mt-1">
                        {patientStatus.totalVisits} visite(s) précédente(s)
                        {patientStatus.lastVisitDate && ` - Dernière visite: ${new Date(patientStatus.lastVisitDate).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {patientStatus && !showManualOverride && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowManualOverride(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Changer le médecin manuellement
                </button>
              </div>
            )}

            {showManualOverride && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 mb-2">Changement manuel du médecin</p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justification requise *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.routing_notes}
                  onChange={(e) => setFormData({ ...formData, routing_notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Expliquez pourquoi le médecin est changé manuellement..."
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  min={minDate}
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure *
                </label>
                <input
                  type="time"
                  required
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif du Rendez-vous *
              </label>
              <select
                required
                value={formData.appointment_type}
                onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="in-person">En personne</option>
                <option value="telemedicine">Télémédecine</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif *
              </label>
              <input
                type="text"
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Consultation générale, Douleur thoracique..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Informations supplémentaires..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || checkingPatientStatus}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Création en cours...' : checkingPatientStatus ? 'Vérification...' : 'Créer le Rendez-vous'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
