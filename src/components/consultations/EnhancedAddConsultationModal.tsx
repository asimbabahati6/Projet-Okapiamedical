import { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface EnhancedAddConsultationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function EnhancedAddConsultationModal({ onClose, onSuccess }: EnhancedAddConsultationModalProps) {
  const { user } = useAuth();
  const [patientNumber, setPatientNumber] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientNumber.trim() || !diagnosis.trim()) return;

    setSaving(true);
    setError('');

    try {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('patient_number', patientNumber.trim())
        .maybeSingle();

      if (!patient) {
        setError('Patient introuvable avec ce numero');
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase.from('consultations').insert({
        patient_id: patient.id,
        doctor_id: user?.id,
        diagnosis,
        symptoms,
        treatment_plan: treatmentPlan,
        notes,
        consultation_date: new Date().toISOString(),
      });

      if (insertError) throw insertError;
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating consultation:', err);
      setError('Erreur lors de la creation');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Nouvelle consultation
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numero patient</label>
            <input
              type="text"
              value={patientNumber}
              onChange={(e) => setPatientNumber(e.target.value)}
              placeholder="PAT-XXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Symptomes</label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnostic</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan de traitement</label>
            <textarea
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !patientNumber.trim() || !diagnosis.trim()}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
