import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Search, Clock, User, FileSearch, UserPlus, RefreshCw,
  ChevronRight, ArrowLeft, AlertCircle, List
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ConsultationProgressBar, type WorkflowStatus } from '../../components/medical-consultation/ConsultationProgressBar';
import { NursePreConsultation, type VitalSigns } from '../../components/medical-consultation/NursePreConsultation';
import { DoctorExamination } from '../../components/medical-consultation/DoctorExamination';

interface ConsultationListItem {
  id: string;
  consultation_number: string | null;
  workflow_status: WorkflowStatus;
  flow_mode: string;
  created_at: string;
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
  vital_signs: any;
  nurse_locked: boolean;
  medical_history: string | null;
  illness_history: string | null;
  additional_anamnesis: string | null;
  physical_examination: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
  paraclinical_exams: any[];
  created_at: string;
  patient?: { first_name: string; last_name: string; patient_number: string; phone: string | null } | null;
}

type FlowMode = 'new_patient' | 'exam_referral';
type ViewMode = 'list' | 'new' | 'detail';

export default function MedicalConsultationPage() {
  const { user, profile } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConsultation, setActiveConsultation] = useState<ConsultationFull | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isNurseRole = profile?.role === 'nurse' || profile?.role === 'infirmier';
  const isDoctorRole = profile?.role === 'doctor' || profile?.role === 'medecin' || profile?.role === 'admin' || profile?.role === 'medical_director';

  const loadConsultations = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('consultations')
        .select('id, consultation_number, workflow_status, flow_mode, created_at, patient:patients(first_name, last_name, patient_number)')
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

  // Detail view
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

  // New consultation form
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

  // List view
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-teal-600" />
            Consultation Médicale
          </h1>
          <p className="text-sm text-gray-500 mt-1">Workflow infirmier - médecin</p>
        </div>
        <button
          onClick={() => setViewMode('new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle consultation
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Total" value={consultations.length} color="gray" />
        <StatCard label="Infirmier" value={consultations.filter(c => c.workflow_status === 'nurse_in_progress' || c.workflow_status === 'nurse_pending').length} color="blue" />
        <StatCard label="Att. Médecin" value={consultations.filter(c => c.workflow_status === 'awaiting_doctor').length} color="amber" />
        <StatCard label="Médecin" value={consultations.filter(c => c.workflow_status === 'doctor_in_progress').length} color="teal" />
        <StatCard label="Terminé" value={consultations.filter(c => c.workflow_status === 'completed').length} color="green" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par patient ou numéro..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="all">Tous les statuts</option>
          <option value="nurse_pending">En attente infirmier</option>
          <option value="nurse_in_progress">Infirmier en cours</option>
          <option value="awaiting_doctor">En attente médecin</option>
          <option value="doctor_in_progress">Médecin en cours</option>
          <option value="completed">Terminé</option>
        </select>
        <button onClick={loadConsultations} className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      ) : filteredConsultations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <List className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">Aucune consultation en cours</p>
          <button
            onClick={() => setViewMode('new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Démarrer une consultation
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {filteredConsultations.map(c => (
            <button
              key={c.id}
              onClick={() => openConsultation(c.id)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                c.flow_mode === 'exam_referral' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                {c.flow_mode === 'exam_referral'
                  ? <FileSearch className="w-4.5 h-4.5 text-blue-600" />
                  : <User className="w-4.5 h-4.5 text-green-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {c.patient ? `${c.patient.last_name} ${c.patient.first_name}` : 'Patient inconnu'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{c.patient?.patient_number}</span>
                  <span className="text-xs text-gray-300">|</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(c.created_at).toLocaleDateString('fr-FR')} {new Date(c.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <WorkflowStatusBadge status={c.workflow_status} />
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stats Card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    gray: 'border-gray-200 text-gray-700',
    blue: 'border-blue-100 text-blue-700',
    amber: 'border-amber-100 text-amber-700',
    teal: 'border-teal-100 text-teal-700',
    green: 'border-green-100 text-green-700',
  };
  return (
    <div className={`bg-white rounded-xl border p-3.5 ${colorClasses[color]}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
}

// ─── Workflow Status Badge ────────────────────────────────────────────────────

function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  const config: Record<WorkflowStatus, { label: string; color: string }> = {
    nurse_pending: { label: 'Infirmier', color: 'bg-gray-100 text-gray-600' },
    nurse_in_progress: { label: 'Infirmier...', color: 'bg-blue-50 text-blue-700' },
    awaiting_doctor: { label: 'Att. Médecin', color: 'bg-amber-50 text-amber-700' },
    doctor_in_progress: { label: 'Médecin...', color: 'bg-teal-50 text-teal-700' },
    completed: { label: 'Terminé', color: 'bg-green-50 text-green-700' },
  };
  const c = config[status] || config.nurse_pending;
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.color}`}>
      {c.label}
    </span>
  );
}

// ─── New Consultation Form ───────────────────────────────────────────────────

interface NewConsultationFormProps {
  userId: string;
  isNurseRole: boolean;
  onBack: () => void;
  onCreated: (id: string) => void;
}

function NewConsultationForm({ userId, isNurseRole, onBack, onCreated }: NewConsultationFormProps) {
  const [flowMode, setFlowMode] = useState<FlowMode | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<{ id: string; first_name: string; last_name: string; patient_number: string }[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<typeof patients>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null);
  const [prescribingDoctor, setPrescribingDoctor] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('patients').select('id, first_name, last_name, patient_number').order('last_name')
      .then(({ data }) => { if (data) setPatients(data); });
  }, []);

  useEffect(() => {
    if (patientSearch.length >= 2) {
      const q = patientSearch.toLowerCase();
      setFilteredPatients(
        patients.filter(p =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
          p.patient_number.toLowerCase().includes(q)
        ).slice(0, 6)
      );
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [patientSearch, patients]);

  async function handleCreate() {
    if (!selectedPatient || !flowMode) {
      setError('Veuillez sélectionner un patient et un type de flux');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const num = `CONS-${Date.now()}`;
      const { data, error: insertErr } = await supabase.from('consultations').insert({
        patient_id: selectedPatient.id,
        consultation_number: num,
        workflow_status: isNurseRole ? 'nurse_in_progress' : 'doctor_in_progress',
        flow_mode: flowMode,
        prescribing_doctor_name: flowMode === 'exam_referral' ? prescribingDoctor || null : null,
        nurse_id: isNurseRole ? userId : null,
        doctor_id: !isNurseRole ? userId : null,
        consultation_date: new Date().toISOString(),
      }).select('id').single();

      if (insertErr) throw insertErr;
      onCreated(data.id);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </button>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Nouvelle Consultation</h2>
          <p className="text-sm text-gray-500 mt-0.5">Sélectionnez le type de flux et le patient</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Flow Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Type de consultation</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFlowMode('new_patient')}
                className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                  flowMode === 'new_patient'
                    ? 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50/30'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  flowMode === 'new_patient' ? 'bg-green-200' : 'bg-green-100'
                }`}>
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 text-sm">Nouveau Patient</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Dossier complet</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFlowMode('exam_referral')}
                className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                  flowMode === 'exam_referral'
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  flowMode === 'exam_referral' ? 'bg-blue-200' : 'bg-blue-100'
                }`}>
                  <FileSearch className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 text-sm">Patient Recommandé</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Examen seul</p>
                </div>
              </button>
            </div>
          </div>

          {/* Patient Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Identification du patient *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatient(null); }}
                placeholder="Numéro patient (PAT-XXXX) ou nom..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            {selectedPatient && (
              <p className="mt-1.5 text-xs text-green-600 font-medium flex items-center gap-1">
                <User className="w-3 h-3" />
                {selectedPatient.last_name} {selectedPatient.first_name} ({selectedPatient.patient_number})
              </p>
            )}
            {showDropdown && filteredPatients.length > 0 && !selectedPatient && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPatient(p); setPatientSearch(`${p.last_name} ${p.first_name}`); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900">{p.last_name} {p.first_name}</span>
                    <span className="text-xs text-gray-500 ml-2">{p.patient_number}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prescribing Doctor (exam referral only) */}
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
    </div>
  );
}

// ─── Consultation Detail (Full Form) ─────────────────────────────────────────

interface ConsultationDetailProps {
  consultation: ConsultationFull;
  isNurseRole: boolean;
  isDoctorRole: boolean;
  userId: string;
  onBack: () => void;
  onRefresh: () => void;
}

function ConsultationDetail({ consultation, isNurseRole, isDoctorRole, userId, onBack, onRefresh }: ConsultationDetailProps) {
  const [complaints, setComplaints] = useState(consultation.nurse_complaints || '');
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>(() => {
    const vs = consultation.vital_signs || {};
    return {
      blood_pressure_systolic: vs.blood_pressure_systolic || '',
      blood_pressure_diastolic: vs.blood_pressure_diastolic || '',
      heart_rate: vs.heart_rate || '',
      temperature: vs.temperature || '',
      weight: vs.weight || '',
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
  const [paraclinicalExams, setParaclinicalExams] = useState<any[]>(consultation.paraclinical_exams || []);
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
              Sauvegardé
            </span>
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

        {/* Progress Bar */}
        <div className="pt-2">
          <ConsultationProgressBar status={consultation.workflow_status} />
        </div>
      </div>

      {/* Nurse Section - always visible */}
      <NursePreConsultation
        complaints={complaints}
        vitalSigns={vitalSigns}
        locked={nurseLocked}
        isNurseView={nurseCanEdit}
        onComplaintsChange={setComplaints}
        onVitalSignChange={handleVitalSignChange}
        onTransferToDoctor={transferToDoctor}
        onToggleEdit={isDoctorRole ? () => setNurseLocked(false) : undefined}
      />

      {/* Doctor Section - always visible once nurse is done, or if doctor opened it directly */}
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
          onFieldChange={handleDoctorFieldChange}
          onParaclinicalChange={setParaclinicalExams}
          onComplete={completeConsultation}
        />
      )}

      {/* Completed badge */}
      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <FileText className="w-4 h-4 text-green-600" />
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


export default MedicalConsultationPage