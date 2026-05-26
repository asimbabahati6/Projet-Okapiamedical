import { useState, useEffect } from 'react';
import { X, Stethoscope, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ExamAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: string;
  patientName: string;
}

const EXAM_TYPES = [
  'Laboratoire',
  'Radiologie',
  'Echographie',
  'Scanner',
  'IRM',
  'Consultation Specialisee',
  'Electrocardiogramme',
  'Endoscopie',
  'Biopsie',
  'Autre',
];

interface DepartmentOption {
  id: string;
  name: string;
}

export function ExamAssignmentModal({ isOpen, onClose, onSuccess, patientId, patientName }: ExamAssignmentModalProps) {
  const { user } = useAuth();
  const [examType, setExamType] = useState('');
  const [notes, setNotes] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDepartments();
      setExamType('');
      setNotes('');
      setDepartmentId('');
      setError('');
      setSaved(false);
    }
  }, [isOpen]);

  async function loadDepartments() {
    const { data } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (data) setDepartments(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!examType) {
      setError("Veuillez selectionner un type d'examen");
      return;
    }

    setSaving(true);
    try {
      const { error: insertError } = await supabase.from('exam_requests').insert({
        patient_id: patientId,
        exam_type: examType,
        status: 'en_attente',
        notes: notes || null,
        department_id: departmentId || null,
        created_by: user?.id || null,
      });

      if (insertError) throw insertError;

      // Also create an admission entry so patient appears in flow
      const { error: admissionError } = await supabase.from('patient_admissions').insert({
        patient_id: patientId,
        flow_type: 'new_patient',
        status: 'waiting',
        tag: 'NOUVEAU',
        department_id: departmentId || null,
        exam_type: examType,
        reason: notes || null,
        notes: `Examen requis: ${examType}`,
        created_by: user?.id || null,
      });

      if (admissionError) throw admissionError;

      setSaved(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Orienter le Patient</h2>
              <p className="text-sm text-gray-500">Assigner un examen requis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success state */}
        {saved ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Patient enregistre et oriente avec succes
            </h3>
            <p className="text-sm text-gray-500">
              {patientName} a ete oriente vers <span className="font-medium text-blue-700">{examType}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Patient info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                {patientName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{patientName}</p>
                <p className="text-xs text-gray-500">Patient nouvellement inscrit</p>
              </div>
            </div>

            {/* Exam type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type d'examen requis <span className="text-red-500">*</span>
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selectionner le type d'examen...</option>
                {EXAM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Building2 className="w-3.5 h-3.5 inline mr-1" />
                Departement d'orientation
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selectionner un departement...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes / Observations
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observations ou instructions supplementaires..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Passer cette etape
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Valider l\'orientation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
