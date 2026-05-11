import { useState, useEffect } from 'react';
import { X, Search, FileSearch, UserPlus, Building2, Stethoscope, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AdmissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
  patient_number: string;
  phone: string | null;
}

interface DepartmentOption {
  id: string;
  name: string;
}

type FlowType = 'exam_only' | 'new_patient' | null;

const EXAM_TYPES = [
  'Radiologie',
  'Laboratoire',
  'Échographie',
  'Scanner',
  'IRM',
  'Électrocardiogramme',
  'Endoscopie',
  'Biopsie',
  'Autre',
];

export function AdmissionFormModal({ isOpen, onClose, onSuccess }: AdmissionFormModalProps) {
  const { user } = useAuth();
  const [flowType, setFlowType] = useState<FlowType>(null);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<PatientOption[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    patient_id: '',
    patient_display: '',
    department_id: '',
    prescribing_doctor_name: '',
    prescribing_doctor_phone: '',
    prescribing_institution: '',
    is_internal: false,
    exam_type: '',
    exam_acts: '' as string,
    reason: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (patientSearch.length >= 2) {
      const q = patientSearch.toLowerCase();
      const filtered = patients.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
        p.patient_number.toLowerCase().includes(q) ||
        (p.phone && p.phone.includes(q))
      );
      setFilteredPatients(filtered.slice(0, 8));
      setShowPatientDropdown(true);
    } else {
      setFilteredPatients([]);
      setShowPatientDropdown(false);
    }
  }, [patientSearch, patients]);

  async function loadData() {
    const [pRes, dRes] = await Promise.all([
      supabase.from('patients').select('id, first_name, last_name, patient_number, phone').order('last_name'),
      supabase.from('departments').select('id, name').eq('is_active', true).order('name'),
    ]);
    if (pRes.data) setPatients(pRes.data);
    if (dRes.data) setDepartments(dRes.data);
  }

  function resetForm() {
    setFlowType(null);
    setPatientSearch('');
    setError('');
    setFormData({
      patient_id: '',
      patient_display: '',
      department_id: '',
      prescribing_doctor_name: '',
      prescribing_doctor_phone: '',
      prescribing_institution: '',
      is_internal: false,
      exam_type: '',
      exam_acts: '',
      reason: '',
      notes: '',
    });
  }

  function selectPatient(patient: PatientOption) {
    setFormData(prev => ({
      ...prev,
      patient_id: patient.id,
      patient_display: `${patient.last_name} ${patient.first_name} (${patient.patient_number})`,
    }));
    setPatientSearch(`${patient.last_name} ${patient.first_name}`);
    setShowPatientDropdown(false);
  }

  function computeTag(): 'EXTERNE' | 'INTERNE' | 'NOUVEAU' {
    if (flowType === 'new_patient') return 'NOUVEAU';
    return formData.is_internal ? 'INTERNE' : 'EXTERNE';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.patient_id) {
      setError('Veuillez sélectionner un patient');
      return;
    }
    if (!flowType) {
      setError('Veuillez sélectionner un type de flux');
      return;
    }

    setSaving(true);
    try {
      const examActs = formData.exam_acts
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);

      const { error: insertError } = await supabase.from('patient_admissions').insert({
        patient_id: formData.patient_id,
        flow_type: flowType,
        status: 'waiting',
        tag: computeTag(),
        department_id: formData.department_id || null,
        prescribing_doctor_name: flowType === 'exam_only' ? formData.prescribing_doctor_name || null : null,
        prescribing_doctor_phone: flowType === 'exam_only' ? formData.prescribing_doctor_phone || null : null,
        prescribing_institution: flowType === 'exam_only' ? formData.prescribing_institution || null : null,
        exam_type: flowType === 'exam_only' ? formData.exam_type || null : null,
        exam_acts: flowType === 'exam_only' ? examActs : [],
        reason: formData.reason || null,
        notes: formData.notes || null,
        created_by: user?.id || null,
      });

      if (insertError) throw insertError;
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Nouvelle Admission</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {!flowType && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 font-medium">Quel type de flux patient ?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFlowType('exam_only')}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FileSearch className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Patient Recommandé</p>
                    <p className="text-xs text-gray-500 mt-1">Examen seul - référé par un confrère</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFlowType('new_patient')}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50/50 transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <UserPlus className="w-7 h-7 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Nouveau Patient</p>
                    <p className="text-xs text-gray-500 mt-1">Parcours de soins complet</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {flowType && (
            <>
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                flowType === 'exam_only'
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-green-50 border-green-200 text-green-800'
              }`}>
                {flowType === 'exam_only' ? <FileSearch className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {flowType === 'exam_only' ? 'Flux Examen (Patient Recommandé)' : 'Flux Nouveau Patient (Parcours de Soins)'}
                </span>
                <button
                  type="button"
                  onClick={() => setFlowType(null)}
                  className="ml-auto text-xs underline opacity-70 hover:opacity-100"
                >
                  Changer
                </button>
              </div>

              {/* Patient Search */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      if (formData.patient_id) {
                        setFormData(prev => ({ ...prev, patient_id: '', patient_display: '' }));
                      }
                    }}
                    placeholder="Rechercher par nom ou numéro patient..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {formData.patient_id && (
                  <p className="mt-1 text-xs text-green-600 font-medium">Sélectionné: {formData.patient_display}</p>
                )}
                {showPatientDropdown && filteredPatients.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredPatients.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPatient(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-sm font-medium text-gray-900">{p.last_name} {p.first_name}</span>
                        <span className="text-xs text-gray-500 ml-2">{p.patient_number}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 inline mr-1" />
                  Département
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Exam-specific fields */}
              {flowType === 'exam_only' && (
                <div className="space-y-4 p-4 bg-blue-50/30 border border-blue-100 rounded-xl">
                  <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Informations du prescripteur
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nom du médecin prescripteur</label>
                      <input
                        type="text"
                        value={formData.prescribing_doctor_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, prescribing_doctor_name: e.target.value }))}
                        placeholder="Dr. ..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
                      <input
                        type="text"
                        value={formData.prescribing_doctor_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, prescribing_doctor_phone: e.target.value }))}
                        placeholder="+243..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Institution d'origine</label>
                      <input
                        type="text"
                        value={formData.prescribing_institution}
                        onChange={(e) => setFormData(prev => ({ ...prev, prescribing_institution: e.target.value }))}
                        placeholder="Clinique, Hôpital..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_internal}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_internal: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Prescripteur interne (Okapia)</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Type d'examen</label>
                      <select
                        value={formData.exam_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, exam_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner...</option>
                        {EXAM_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Actes demandés</label>
                      <input
                        type="text"
                        value={formData.exam_acts}
                        onChange={(e) => setFormData(prev => ({ ...prev, exam_acts: e.target.value }))}
                        placeholder="Acte 1, Acte 2, ..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">Séparer par des virgules</p>
                    </div>
                  </div>
                </div>
              )}

              {/* New patient specific fields */}
              {flowType === 'new_patient' && (
                <div className="space-y-3 p-4 bg-green-50/30 border border-green-100 rounded-xl">
                  <h3 className="text-sm font-semibold text-green-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Parcours de soins
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Motif de la première visite *</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Motif de consultation..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optionnel)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observations supplémentaires..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </form>

        {flowType && (
          <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !formData.patient_id}
              className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                flowType === 'exam_only'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer l\'admission'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
