import { useState, useEffect } from 'react';
import { CheckCircle, X, Shield, DollarSign, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Appointment } from '../../types/database';
import { sendAppointmentValidationNotification } from '../../services/notificationService';

interface ValidationStep {
  id: string;
  appointment_id: string;
  step: number;
  status: 'pending' | 'approved' | 'rejected';
  validator_name: string | null;
  validator_role: string | null;
  notes: string;
  validated_at: string | null;
}

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

const STEP1_ROLES = ['medecin_chef_staff', 'medical_director', 'admin', 'super_admin', 'hospital_admin'];
const STEP2_ROLES = ['caissiere', 'accountant', 'admin', 'super_admin', 'hospital_admin'];

export function AppointmentValidationModal({ appointment, onClose, onSuccess }: Props) {
  const { profile } = useAuth();
  const [steps, setSteps] = useState<ValidationStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [notifResult, setNotifResult] = useState<{ smsPreview: string; emailPreview: string } | null>(null);

  const userRole = (profile?.role as { name?: string } | null)?.name || '';
  const canStep1 = STEP1_ROLES.includes(userRole);
  const canStep2 = STEP2_ROLES.includes(userRole);

  useEffect(() => {
    fetchValidations();
  }, [appointment.id]);

  async function fetchValidations() {
    setLoading(true);
    const { data } = await supabase
      .from('appointment_validations')
      .select('*')
      .eq('appointment_id', appointment.id)
      .order('step');
    setSteps(data || []);
    setLoading(false);
  }

  const step1 = steps.find(s => s.step === 1);
  const step2 = steps.find(s => s.step === 2);

  const step1Done = step1?.status === 'approved';
  const step2Done = step2?.status === 'approved';
  const fullyValidated = step1Done && step2Done;

  async function validate(step: number) {
    if (!profile) return;
    setSubmitting(true);
    try {
      const row = {
        appointment_id: appointment.id,
        step,
        status: 'approved',
        validator_id: profile.id,
        validator_name: profile.full_name,
        validator_role: userRole,
        notes,
        validated_at: new Date().toISOString(),
      };

      const existing = steps.find(s => s.step === step);
      if (existing) {
        await supabase.from('appointment_validations').update(row).eq('id', existing.id);
      } else {
        await supabase.from('appointment_validations').insert(row);
      }

      await supabase.from('validation_audit_logs').insert({
        appointment_id: appointment.id,
        validation_step: step,
        action: 'approved',
        actor_id: profile.id,
        actor_name: profile.full_name,
        actor_role: userRole,
        notes,
      });

      const result = await sendAppointmentValidationNotification({
        patientName: appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : 'Patient',
        patientEmail: appointment.patient?.email,
        patientPhone: appointment.patient?.phone,
        validatorName: profile.full_name,
        appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('fr-FR'),
        appointmentTime: appointment.appointment_time.substring(0, 5),
        appointmentNumber: appointment.appointment_number,
      });

      setNotifResult(result);
      setNotes('');
      await fetchValidations();
    } finally {
      setSubmitting(false);
    }
  }

  const patientName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : 'Patient inconnu';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Validation du Rendez-vous</h2>
            <p className="text-blue-100 text-sm">{appointment.appointment_number} · {patientName}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <StepBadge step={1} status={step1?.status || 'pending'} />
                <div className="h-px flex-1 bg-gray-200" />
                <StepBadge step={2} status={step2?.status || 'pending'} />
              </div>

              <ValidationStepCard
                step={1}
                label="Validation Médicale"
                description="Dr TOTI Benedickt — Médecin Chef de Staff"
                icon={<Shield className="w-5 h-5 text-blue-600" />}
                validation={step1}
                canValidate={canStep1 && !step1Done}
                notes={notes}
                onNotesChange={setNotes}
                onValidate={() => validate(1)}
                submitting={submitting}
              />

              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <ChevronRight className="w-4 h-4" />
                <span>Après validation médicale</span>
              </div>

              <ValidationStepCard
                step={2}
                label="Validation Financière"
                description="Grace NZOLA — Caissière"
                icon={<DollarSign className="w-5 h-5 text-green-600" />}
                validation={step2}
                canValidate={canStep2 && step1Done && !step2Done}
                notes={notes}
                onNotesChange={setNotes}
                onValidate={() => validate(2)}
                submitting={submitting}
                locked={!step1Done}
              />

              {fullyValidated && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-semibold text-sm">Rendez-vous entièrement validé</p>
                    <p className="text-green-700 text-xs mt-1">Les deux étapes ont été approuvées. Les notifications ont été envoyées au patient.</p>
                  </div>
                </div>
              )}

              {notifResult && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 font-semibold text-sm mb-2">Notifications envoyées</p>
                  <div className="bg-white rounded-lg p-3 border border-blue-100 mb-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">SMS :</p>
                    <p className="text-xs text-gray-800 italic">"{notifResult.smsPreview}"</p>
                  </div>
                  <p className="text-xs text-blue-600">Email HTML envoyé avec les détails complets.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 pb-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
          {fullyValidated && (
            <button
              onClick={onSuccess}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Terminé
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepBadge({ step, status }: { step: number; status: string }) {
  const colorMap: Record<string, string> = {
    approved: 'bg-green-500 text-white',
    rejected: 'bg-red-500 text-white',
    pending: 'bg-gray-200 text-gray-600',
  };
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${colorMap[status] || colorMap.pending}`}>
      {status === 'approved' ? <CheckCircle className="w-4 h-4" /> : step}
    </div>
  );
}

interface StepCardProps {
  step: number;
  label: string;
  description: string;
  icon: React.ReactNode;
  validation: ValidationStep | undefined;
  canValidate: boolean;
  notes: string;
  onNotesChange: (v: string) => void;
  onValidate: () => void;
  submitting: boolean;
  locked?: boolean;
}

function ValidationStepCard({ step, label, description, icon, validation, canValidate, notes, onNotesChange, onValidate, submitting, locked }: StepCardProps) {
  const approved = validation?.status === 'approved';

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      approved ? 'bg-green-50 border-green-200' :
      locked ? 'bg-gray-50 border-gray-200 opacity-60' :
      'bg-white border-gray-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${approved ? 'bg-green-100' : 'bg-blue-50'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
            {approved && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Approuvé</span>
            )}
            {locked && !approved && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">En attente étape 1</span>
            )}
          </div>

          {approved && validation && (
            <div className="mt-2 text-xs text-green-700 space-y-0.5">
              <p>Validé par : <strong>{validation.validator_name}</strong></p>
              {validation.validated_at && (
                <p>Le {new Date(validation.validated_at).toLocaleString('fr-FR')}</p>
              )}
              {validation.notes && <p className="italic">"{validation.notes}"</p>}
            </div>
          )}

          {canValidate && !approved && (
            <div className="mt-3 space-y-2">
              <textarea
                value={notes}
                onChange={e => onNotesChange(e.target.value)}
                placeholder="Notes (optionnel)..."
                rows={2}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <button
                onClick={onValidate}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Valider l'étape {step}
              </button>
            </div>
          )}

          {!canValidate && !approved && !locked && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5" />
              Votre rôle n'est pas autorisé pour cette étape
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
