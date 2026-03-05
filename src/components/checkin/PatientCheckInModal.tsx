import { useState, useEffect } from 'react';
import { X, User, Calendar, Clock, AlertCircle, CheckCircle, UserPlus, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Patient, Appointment } from '../../types/database';
import { checkPatientStatus } from '../../utils/patientRouting';
import { RoutingInstructions } from './RoutingInstructions';
import { NewPatientRegistration } from './NewPatientRegistration';
import { useAuth } from '../../contexts/AuthContext';

interface PatientCheckInModalProps {
  patient: Patient;
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PatientCheckInModal({
  patient,
  appointment,
  onClose,
  onSuccess,
}: PatientCheckInModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'verification' | 'routing' | 'registration'>('verification');
  const [patientStatus, setPatientStatus] = useState<any>(null);
  const [checkInData, setCheckInData] = useState<any>(null);
  const [queueNumber, setQueueNumber] = useState('');

  useEffect(() => {
    verifyPatientStatus();
  }, [patient.id]);

  async function verifyPatientStatus() {
    setLoading(true);
    try {
      const status = await checkPatientStatus(patient.id);
      setPatientStatus(status);
    } catch (error) {
      console.error('Error verifying patient status:', error);
      setError('Erreur lors de la vérification du statut du patient');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn() {
    setSubmitting(true);
    setError('');

    try {
      const queueNum = await generateQueueNumber();
      setQueueNumber(queueNum);

      const isNewPatient = patientStatus?.isNewPatient || false;
      const routingDecision = isNewPatient ? 'to_reception' : 'to_physician';
      const assignedTo = isNewPatient ? profile?.id : patient.primary_care_physician_id;

      const checkInRecord = {
        patient_id: patient.id,
        appointment_id: appointment?.id || null,
        checkin_type: appointment ? 'scheduled_appointment' : 'walk_in',
        is_new_patient: isNewPatient,
        routing_decision: routingDecision,
        assigned_to: assignedTo,
        queue_number: queueNum,
        status: isNewPatient ? 'in_registration' : 'waiting',
        intake_forms_completed: false,
        checked_in_by: profile?.id,
      };

      const { data: checkIn, error: checkInError } = await supabase
        .from('patient_checkins')
        .insert(checkInRecord)
        .select()
        .single();

      if (checkInError) throw checkInError;

      setCheckInData(checkIn);

      if (appointment) {
        await supabase
          .from('appointments')
          .update({
            status: 'in_progress',
            checked_in_at: new Date().toISOString(),
          })
          .eq('id', appointment.id);
      }

      if (!isNewPatient && patient.primary_care_physician_id) {
        const { error: queueError } = await supabase
          .from('waiting_queue')
          .insert({
            checkin_id: checkIn.id,
            patient_id: patient.id,
            physician_id: patient.primary_care_physician_id,
            queue_number: queueNum,
            priority_level: 3,
            estimated_wait_minutes: 15,
          });

        if (queueError) throw queueError;
      }

      if (isNewPatient) {
        await createIntakeForms(checkIn.id);
        setStep('registration');
      } else {
        setStep('routing');
      }
    } catch (error: any) {
      console.error('Error during check-in:', error);
      setError(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  }

  async function generateQueueNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_queue_number');
    if (error) throw error;
    return data;
  }

  async function createIntakeForms(checkInId: string) {
    const forms = [
      {
        checkin_id: checkInId,
        patient_id: patient.id,
        form_type: 'personal_info',
        form_name: 'Informations Personnelles',
        is_required: true,
      },
      {
        checkin_id: checkInId,
        patient_id: patient.id,
        form_type: 'medical_history',
        form_name: 'Antécédents Médicaux',
        is_required: true,
      },
      {
        checkin_id: checkInId,
        patient_id: patient.id,
        form_type: 'insurance',
        form_name: 'Informations d\'Assurance',
        is_required: false,
      },
      {
        checkin_id: checkInId,
        patient_id: patient.id,
        form_type: 'consent',
        form_name: 'Consentement Médical',
        is_required: true,
      },
    ];

    const { error } = await supabase.from('intake_forms').insert(forms);
    if (error) throw error;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Vérification du statut du patient...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'registration' && checkInData) {
    return (
      <NewPatientRegistration
        patient={patient}
        checkInId={checkInData.id}
        queueNumber={queueNumber}
        onClose={onClose}
        onComplete={onSuccess}
      />
    );
  }

  if (step === 'routing' && checkInData) {
    return (
      <RoutingInstructions
        patient={patient}
        checkInData={checkInData}
        queueNumber={queueNumber}
        isNewPatient={patientStatus?.isNewPatient || false}
        onClose={onClose}
        onComplete={onSuccess}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Enregistrement Patient</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Erreur</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {patient.first_name} {patient.last_name}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>N° Patient: {patient.patient_number}</p>
                  {patient.phone && <p>Téléphone: {patient.phone}</p>}
                  {patient.date_of_birth && (
                    <p>Date de naissance: {new Date(patient.date_of_birth).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {appointment && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Rendez-vous Planifié</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(appointment.appointment_date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{appointment.appointment_time.slice(0, 5)}</span>
                </div>
              </div>
              {appointment.doctor?.user_profile && (
                <p className="text-sm text-gray-600 mt-2">
                  Médecin: {appointment.doctor.user_profile.full_name}
                </p>
              )}
            </div>
          )}

          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Statut du Patient</h4>

            {patientStatus?.isNewPatient ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <UserPlus className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Nouveau Patient</p>
                    <p className="text-sm text-green-700 mt-1">
                      Ce patient n'a pas de dossier médical dans notre système.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-900 mb-2">Action Requise</h5>
                  <p className="text-sm text-yellow-800 mb-3">
                    Le patient doit compléter les formulaires d'inscription à la réception.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-yellow-700">
                    <Clock className="w-4 h-4" />
                    <span>Temps estimé: 10-15 minutes</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Patient Existant</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Dossier médical trouvé dans notre système.
                    </p>
                  </div>
                </div>

                {patientStatus?.totalVisits > 0 && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Visites précédentes</p>
                      <p className="font-semibold text-gray-900">{patientStatus.totalVisits}</p>
                    </div>
                    {patientStatus?.lastVisitDate && (
                      <div>
                        <p className="text-gray-600">Dernière visite</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(patientStatus.lastVisitDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {patient.primary_care_physician_id && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-1">Médecin traitant assigné</p>
                    <p className="font-medium text-gray-900">
                      {patient.primary_care_physician?.user_profile?.full_name || 'Non disponible'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCheckIn}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <span>Enregistrer</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
