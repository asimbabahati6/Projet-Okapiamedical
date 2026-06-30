import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Search, Clock, User, FileSearch, UserPlus, RefreshCw,
  ChevronRight, ArrowLeft, AlertCircle, List, ClipboardList, Bell, CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logActivity } from '../../utils/activityLogger';
import { ConsultationProgressBar, type WorkflowStatus } from '../../components/medical-consultation/ConsultationProgressBar';
import { NursePreConsultation, type VitalSigns } from '../../components/medical-consultation/NursePreConsultation';
import { DoctorExamination } from '../../components/medical-consultation/DoctorExamination';

interface ConsultationListItem {
  id: string;
  consultation_number: string | null;
  workflow_status: WorkflowStatus;
  flow_mode: string;
  created_at: string;
  nurse_completed_at?: string | null;
  patient?: { first_name: string; last_name: string; patient_number: string } | null;
}

interface ConsultationFull {
  id: string;
  consultation_number: string | null;
  patient_id: string | null;
  doctor_id: string | null;
  nurse_id: string | null;
  workflow_status: WorkflowStatus;
  flow_mode: string;
  prescribing_doctor_name: string | null;
  nurse_complaints: string | null;
  vital_signs: Record<string, string>;
  nurse_locked: boolean;
  nurse_completed_at?: string | null;
  medical_history: string | null;
  illness_history: string | null;
  additional_anamnesis: string | null;
  physical_examination: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  paraclinical_exams: { id: string; name: string; completed: boolean }[];
  created_at: string;
  patient?: { first_name: string; last_name: string; patient_number: string; phone: string | null } | null;
}

type FlowMode = 'new_patient' | 'exam_referral';
type ViewMode = 'list' | 'new' | 'detail';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(status: WorkflowStatus): { label: string; color: string } {
  switch (status) {
    case 'nurse_pending': return { label: 'En attente infirmier', color: 'bg-gray-100 text-gray-600' };
    case 'nurse_in_progress': return { label: 'Infirmier en cours', color: 'bg-blue-100 text-blue-700' };
    case 'awaiting_doctor': return { label: '⏳ En attente médecin', color: 'bg-amber-100 text-amber-700' };
    case 'doctor_in_progress': return { label: 'Médecin en cours', color: 'bg-teal-100 text-teal-700' };
    case 'completed': return { label: 'Terminée', color: 'bg-green-100 text-green-700' };
    default: return { label: status, color: 'bg-gray-100 text-gray-500' };
  }
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MedicalConsultationPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConsultation, setActiveConsultation] = useState<ConsultationFull | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isNurseRole = profile?.role === 'nurse' || profile?.role === 'infirmier';
  const isDoctorRole = profile?.role === 'doctor' || profile?.role === 'medecin' || profile?.role === 'admin' || profile?.role === 'medical_director';

  // ✅ Compter les fiches en attente médecin pour la notification
  const awaitingDoctorCount = consultations.filter(c => c.workflow_status === 'awaiting_doctor').length;

  const loadConsultations = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('consultations')
        .select('id, consultation_number, workflow_status, flow_mode, created_at, nurse_completed_at, patient:patients(first_name, last_name, patient_number)')
        .not('workflow_status', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') {
        query = query.eq('workflow_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setConsultations(data || []);
    } catch (err) {
      console.error('Error loading consultations:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  // ✅ Notification temps réel : actualisation quand une fiche passe en awaiting_doctor
  useEffect(() => {
    const channel = supabase
      .channel('consultations-list-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'consultations' },
        (payload) => {
          const updated = payload.new as { workflow_status: WorkflowStatus; id: string };
          setConsultations(prev =>
            prev.map(c => c.id === updated.id ? { ...c, workflow_status: updated.workflow_status } : c)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function openConsultation(id: string) {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*, patient:patients(first_name, last_name, patient_number, phone)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setActiveConsultation(data);
        setViewMode('detail');
      }
    } catch (err) {
      console.error('Error loading consultation:', err);
    }
  }

  function handleCreated(id: string) {
    openConsultation(id);
    loadConsultations();
  }

  function handleBack() {
    setViewMode('list');
    setActiveConsultation(null);
    loadConsultations();
  }

  const filteredConsultations = consultations.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const patientName = c.patient ? `${c.patient.first_name} ${c.patient.last_name}`.toLowerCase() : '';
    const patientNum = c.patient?.patient_number?.toLowerCase() || '';
    return patientName.includes(q) || patientNum.includes(q) || (c.consultation_number || '').toLowerCase().includes(q);
  });

  if (viewMode === 'detail' && activeConsultation) {
    return (
      <ConsultationDetail
        consultation={activeConsultation}
        isNurseRole={isNurseRole}
        isDoctorRole={isDoctorRole}
        userId={user?.id || ''}
        onBack={handleBack}
        onRefresh={async () => { await openConsultation(activeConsultation.id); }}
      />
    );
  }

  if (viewMode === 'new') {
    return (
      <NewConsultationForm
        userId={user?.id || ''}
        isNurseRole={isNurseRole}
        onBack={() => setViewMode('list')}
        onCreated={handleCreated}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-teal-600" />
            Consultations
          </h1>
          <p className="text-gray-500 mt-1">Gestion des fiches de consultation</p>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ Badge notification médecin */}
          {isDoctorRole && awaitingDoctorCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
              <Bell className="w-4 h-4" />
              {awaitingDoctorCount} fiche{awaitingDoctorCount > 1 ? 's' : ''} en attente
            </div>
          )}
          <button
            onClick={() => loadConsultations()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          <button
            onClick={() => setViewMode('new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle consultation
          </button>
        </div>
      </div>

      {/* ✅ Section prioritaire : fiches en attente médecin */}
      {isDoctorRole && awaitingDoctorCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Fiches en attente de votre examen
          </h3>
          <div className="space-y-2">
            {consultations
              .filter(c => c.workflow_status === 'awaiting_doctor')
              .map(c => (
                <button
                  key={c.id}
                  onClick={() => openConsultation(c.id)}
                  className="w-full flex items-center justify-between p-3 bg-white border border-amber-200 rounded-lg hover:border-amber-400 hover:shadow-sm transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {c.patient ? `${c.patient.last_name} ${c.patient.first_name}` : 'Patient'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {c.nurse_completed_at ? `Transféré ${timeAgo(c.nurse_completed_at)}` : timeAgo(c.created_at)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-500" />
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un patient ou N° dossier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="nurse_pending">En attente infirmier</option>
          <option value="nurse_in_progress">Infirmier en cours</option>
          <option value="awaiting_doctor">En attente médecin</option>
          <option value="doctor_in_progress">Médecin en cours</option>
          <option value="completed">Terminées</option>
        </select>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : filteredConsultations.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune consultation trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConsultations.map((c) => {
              const status = statusLabel(c.workflow_status);
              const name = c.patient
                ? `${c.patient.last_name} ${c.patient.first_name}`
                : 'Patient inconnu';
              const isAwaitingDoctor = c.workflow_status === 'awaiting_doctor';
              return (
                <button
                  key={c.id}
                  onClick={() => openConsultation(c.id)}
                  className={`w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left ${
                    isAwaitingDoctor ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isAwaitingDoctor ? 'bg-amber-100' : 'bg-gray-100'
                    }`}>
                      <User className={`w-5 h-5 ${isAwaitingDoctor ? 'text-amber-700' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{c.consultation_number || c.id.slice(0, 8)}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(c.created_at)}
                        </span>
                        {c.nurse_completed_at && isAwaitingDoctor && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-amber-600 font-medium">
                              Transféré {timeAgo(c.nurse_completed_at)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Consultation Detail ──────────────────────────────────────────────────────

interface ConsultationDetailProps {
  consultation: ConsultationFull;
  isNurseRole: boolean;
  isDoctorRole: boolean;
  userId: string;
  onBack: () => void;
  onRefresh: () => void;
}

function ConsultationDetail({ consultation, isNurseRole, isDoctorRole, userId, onBack, onRefresh }: ConsultationDetailProps) {
  const detailNavigate = useNavigate();
  const [complaints, setComplaints] = useState(consultation.nurse_complaints || '');
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>(() => {
    const vs = consultation.vital_signs || {};
    return {
      blood_pressure_systolic: vs.blood_pressure_systolic || '',
      blood_pressure_diastolic: vs.blood_pressure_diastolic || '',
      heart_rate: vs.heart_rate || '',
      temperature: vs.temperature || '',
      weight: vs.weight || '',
      height: vs.height || '',
      oxygen_saturation: vs.oxygen_saturation || '',
    };
  });
  const [nurseLocked, setNurseLocked] = useState(consultation.nurse_locked || false);
  const [medicalHistory, setMedicalHistory] = useState(consultation.medical_history || '');
  const [illnessHistory, setIllnessHistory] = useState(consultation.illness_history || '');
  const [additionalAnamnesis, setAdditionalAnamnesis] = useState(consultation.additional_anamnesis || '');
  const [physicalExamination, setPhysicalExamination] = useState(consultation.physical_examination || '');
  const [diagnosis, setDiagnosis] = useState(consultation.diagnosis || '');
  const [treatmentPlan, setTreatmentPlan] = useState(consultation.treatment_plan || '');
  const [paraclinicalExams, setParaclinicalExams] = useState<{ id: string; name: string; completed: boolean }[]>(consultation.paraclinical_exams || []);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function saveNurseData() {
    setSaving(true);
    try {
      await supabase.from('consultations').update({
        nurse_complaints: complaints,
        vital_signs: vitalSigns,
        workflow_status: 'nurse_in_progress',
        nurse_id: userId,
        updated_at: new Date().toISOString(),
      }).eq('id', consultation.id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function transferToDoctor() {
    setSaving(true);
    try {
      await supabase.from('consultations').update({
        nurse_complaints: complaints,
        vital_signs: vitalSigns,
        nurse_locked: true,
        nurse_completed_at: new Date().toISOString(),
        workflow_status: 'awaiting_doctor',
        nurse_id: userId,
        updated_at: new Date().toISOString(),
      }).eq('id', consultation.id);
      logActivity('transfer', 'consultations', `Fiche transferee au medecin: ${consultation.consultation_number || consultation.id}`);
      setNurseLocked(true);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveDoctorData() {
    setSaving(true);
    try {
      await supabase.from('consultations').update({
        medical_history: medicalHistory,
        illness_history: illnessHistory,
        additional_anamnesis: additionalAnamnesis,
        physical_examination: physicalExamination,
        diagnosis,
        treatment_plan: treatmentPlan,
        paraclinical_exams: paraclinicalExams,
        workflow_status: 'doctor_in_progress',
        doctor_id: userId,
        updated_at: new Date().toISOString(),
      }).eq('id', consultation.id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function completeConsultation() {
    setSaving(true);
    try {
      await supabase.from('consultations').update({
        medical_history: medicalHistory,
        illness_history: illnessHistory,
        additional_anamnesis: additionalAnamnesis,
        physical_examination: physicalExamination,
        diagnosis,
        treatment_plan: treatmentPlan,
        paraclinical_exams: paraclinicalExams,
        workflow_status: 'completed',
        doctor_id: userId,
        doctor_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', consultation.id);
      logActivity('close', 'consultations', `Consultation cloturee: ${consultation.consultation_number || consultation.id}`);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  function handleVitalSignChange(key: keyof VitalSigns, value: string) {
    setVitalSigns(prev => ({ ...prev, [key]: value }));
  }

  function handleDoctorFieldChange(field: string, value: string) {
    switch (field) {
      case 'medicalHistory': setMedicalHistory(value); break;
      case 'illnessHistory': setIllnessHistory(value); break;
      case 'additionalAnamnesis': setAdditionalAnamnesis(value); break;
      case 'physicalExamination': setPhysicalExamination(value); break;
      case 'diagnosis': setDiagnosis(value); break;
      case 'treatmentPlan': setTreatmentPlan(value); break;
    }
  }

  const patientName = consultation.patient
    ? `${consultation.patient.last_name} ${consultation.patient.first_name}`
    : 'Patient';

  const isCompleted = consultation.workflow_status === 'completed';
  const nurseCanEdit = (isNurseRole || isDoctorRole) && !nurseLocked;
  const doctorCanEdit = isDoctorRole && !isCompleted;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full font-medium border border-green-200">
              Sauvegardé ✓
            </span>
          )}
          {isCompleted && (
            <button
              onClick={() => detailNavigate(`/staff/medical-report/${consultation.id}`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Rapport
            </button>
          )}
          {!isCompleted && (
            <button
              onClick={isDoctorRole ? saveDoctorData : saveNurseData}
              disabled={saving}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          )}
        </div>
      </div>

      {/* Patient Info + Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{patientName}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span>{consultation.patient?.patient_number}</span>
                {consultation.patient?.phone && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span>{consultation.patient.phone}</span>
                  </>
                )}
                {consultation.flow_mode === 'exam_referral' && consultation.prescribing_doctor_name && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-blue-600">Prescripteur: {consultation.prescribing_doctor_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            consultation.flow_mode === 'exam_referral'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {consultation.flow_mode === 'exam_referral' ? 'Examen Référé' : 'Nouveau Patient'}
          </div>
        </div>

        <div className="pt-2">
          <ConsultationProgressBar status={consultation.workflow_status} />
        </div>
      </div>

      {/* Nurse Section */}
      <NursePreConsultation
        complaints={complaints}
        vitalSigns={vitalSigns}
        locked={nurseLocked}
        isNurseView={nurseCanEdit}
        transferredAt={consultation.nurse_completed_at}
        onComplaintsChange={setComplaints}
        onVitalSignChange={handleVitalSignChange}
        onTransferToDoctor={transferToDoctor}
        onToggleEdit={isDoctorRole ? () => setNurseLocked(false) : undefined}
      />

      {/* Doctor Section — ✅ avec signes vitaux et plaintes passés */}
      {(nurseLocked || isDoctorRole || consultation.workflow_status === 'doctor_in_progress' || isCompleted) && (
        <DoctorExamination
          medicalHistory={medicalHistory}
          illnessHistory={illnessHistory}
          additionalAnamnesis={additionalAnamnesis}
          physicalExamination={physicalExamination}
          diagnosis={diagnosis}
          treatmentPlan={treatmentPlan}
          paraclinicalExams={paraclinicalExams}
          disabled={!doctorCanEdit}
          vitalSigns={vitalSigns}
          nurseComplaints={complaints}
          onFieldChange={handleDoctorFieldChange}
          onParaclinicalChange={setParaclinicalExams}
          onComplete={completeConsultation}
        />
      )}

      {/* Completed badge */}
      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Consultation terminée</p>
            <p className="text-xs text-green-600 mt-0.5">
              Clôturée le {consultation.created_at ? new Date(consultation.created_at).toLocaleDateString('fr-FR') : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── New Consultation Form ────────────────────────────────────────────────────

interface NewConsultationFormProps {
  userId: string;
  isNurseRole: boolean;
  onBack: () => void;
  onCreated: (id: string) => void;
}

function NewConsultationForm({ userId, isNurseRole, onBack, onCreated }: NewConsultationFormProps) {
  const [flowMode, setFlowMode] = useState<FlowMode | ''>('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<{ id: string; first_name: string; last_name: string; patient_number: string }[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [prescribingDoctor, setPrescribingDoctor] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return; }
    supabase
      .from('patients')
      .select('id, first_name, last_name, patient_number')
      .or(`first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%,patient_number.ilike.%${patientSearch}%`)
      .limit(10)
      .then(({ data }) => setPatients(data || []));
  }, [patientSearch]);

  async function handleCreate() {
    if (!selectedPatient || !flowMode) { setError('Veuillez sélectionner un patient et un mode.'); return; }
    setSaving(true);
    setError('');
    try {
      const num = `CONS-${Date.now().toString(36).toUpperCase()}`;
      const { data, error: err } = await supabase
        .from('consultations')
        .insert({
          consultation_number: num,
          patient_id: selectedPatient,
          flow_mode: flowMode,
          prescribing_doctor_name: flowMode === 'exam_referral' ? prescribingDoctor : null,
          workflow_status: 'nurse_pending',
          nurse_complaints: '',
          vital_signs: {},
          nurse_locked: false,
          paraclinical_exams: [],
          created_by: userId,
        })
        .select()
        .single();
      if (err) throw err;
      onCreated(data.id);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Erreur inconnue';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <h2 className="text-xl font-bold text-gray-900">Nouvelle consultation</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Flow Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Type de consultation</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { mode: 'new_patient' as FlowMode, label: 'Nouveau patient', icon: UserPlus, desc: 'Première consultation' },
              { mode: 'exam_referral' as FlowMode, label: 'Examen référé', icon: FileSearch, desc: 'Référé par un médecin' },
            ].map(opt => (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setFlowMode(opt.mode)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  flowMode === opt.mode
                    ? 'border-teal-400 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <opt.icon className={`w-5 h-5 mb-2 ${flowMode === opt.mode ? 'text-teal-600' : 'text-gray-400'}`} />
                <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Patient Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Rechercher le patient</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatient(''); }}
              placeholder="Nom, prénom ou N° patient..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          {patients.length > 0 && !selectedPatient && (
            <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {patients.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedPatient(p.id); setPatientSearch(`${p.last_name} ${p.first_name}`); setPatients([]); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
                >
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.last_name} {p.first_name}</p>
                    <p className="text-xs text-gray-400">{p.patient_number}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedPatient && (
            <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Patient sélectionné
            </p>
          )}
        </div>

        {flowMode === 'exam_referral' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Médecin Prescripteur</label>
            <input
              type="text"
              value={prescribingDoctor}
              onChange={(e) => setPrescribingDoctor(e.target.value)}
              placeholder="Dr. ..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={saving || !selectedPatient || !flowMode}
          className="w-full px-5 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm disabled:opacity-50 shadow-sm"
        >
          {saving ? 'Création en cours...' : 'Créer et ouvrir la consultation'}
        </button>
      </div>
    </div>
  );
}
