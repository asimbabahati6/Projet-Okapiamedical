import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Pill, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PrescriptionMedication {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
}

interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
  patient_number: string;
}

interface AddPrescriptionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const FREQUENCY_OPTIONS = [
  '1 fois par jour',
  '2 fois par jour',
  '3 fois par jour',
  '4 fois par jour',
  'Toutes les 4 heures',
  'Toutes les 6 heures',
  'Toutes les 8 heures',
  'Toutes les 12 heures',
  'Au coucher',
  'Au besoin',
  'Une fois par semaine',
];

const DURATION_OPTIONS = [
  '3 jours',
  '5 jours',
  '7 jours',
  '10 jours',
  '14 jours',
  '21 jours',
  '30 jours',
  '60 jours',
  '90 jours',
];

export default function AddPrescriptionModal({ onClose, onSuccess }: AddPrescriptionModalProps) {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [medications, setMedications] = useState<PrescriptionMedication[]>([
    { id: crypto.randomUUID(), medication_name: '', dosage: '', frequency: '3 fois par jour', duration: '7 jours', quantity: 1, instructions: '' },
  ]);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    const { data } = await supabase
      .from('patients')
      .select('id, first_name, last_name, patient_number')
      .order('last_name')
      .limit(300);
    if (data) setPatients(data);
  }

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch) return true;
    const term = patientSearch.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(term) ||
      p.last_name.toLowerCase().includes(term) ||
      p.patient_number?.toLowerCase().includes(term)
    );
  });

  function addMedication() {
    setMedications([...medications, {
      id: crypto.randomUUID(),
      medication_name: '',
      dosage: '',
      frequency: '3 fois par jour',
      duration: '7 jours',
      quantity: 1,
      instructions: '',
    }]);
  }

  function removeMedication(id: string) {
    if (medications.length <= 1) return;
    setMedications(medications.filter((m) => m.id !== id));
  }

  function updateMedication(id: string, field: keyof PrescriptionMedication, value: string | number) {
    setMedications(medications.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedPatient) {
      setError('Veuillez selectionner un patient.');
      return;
    }

    const validMeds = medications.filter((m) => m.medication_name.trim());
    if (validMeds.length === 0) {
      setError('Ajoutez au moins un medicament.');
      return;
    }

    const incompleteMed = validMeds.find((m) => !m.dosage.trim() || !m.frequency.trim() || !m.duration.trim());
    if (incompleteMed) {
      setError('Veuillez remplir le dosage, la frequence et la duree pour chaque medicament.');
      return;
    }

    setSaving(true);
    try {
      const now = new Date();
      const prescriptionNumber = `RX-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      const firstMed = validMeds[0];

      const { data: prescription, error: rxError } = await supabase
        .from('prescriptions')
        .insert({
          prescription_number: prescriptionNumber,
          patient_id: selectedPatient.id,
          medication_name: firstMed.medication_name,
          dosage: firstMed.dosage,
          frequency: firstMed.frequency,
          duration: firstMed.duration,
          quantity: firstMed.quantity,
          instructions: firstMed.instructions || null,
          prescription_date: now.toISOString(),
          expiration_date: expirationDate.toISOString().split('T')[0],
          status: 'active',
          diagnosis: diagnosis || null,
          notes: notes || null,
        })
        .select('id')
        .single();

      if (rxError) throw rxError;

      if (validMeds.length > 1) {
        const itemsToInsert = validMeds.slice(1).map((med) => ({
          prescription_id: prescription.id,
          medication_id: null,
          dosage: med.dosage,
          quantity: med.quantity,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions || null,
          substitution_allowed: false,
          stock_available: true,
        }));

        await supabase.from('prescription_items').insert(itemsToInsert);
      }

      onSuccess();
    } catch (err: unknown) {
      console.error('Error creating prescription:', err);
      const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Erreur inconnue';
      setError(`Echec de la creation: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700">
          <div className="flex items-center gap-3">
            <Pill className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">Nouvelle Prescription</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Patient *</label>
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedPatient.last_name} {selectedPatient.first_name}
                    </p>
                    <p className="text-sm text-gray-500">{selectedPatient.patient_number}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un patient par nom ou numero..."
                    value={patientSearch}
                    onChange={(e) => { setPatientSearch(e.target.value); setShowPatientDropdown(true); }}
                    onFocus={() => setShowPatientDropdown(true)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                  {showPatientDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredPatients.length === 0 ? (
                        <div className="p-3 text-sm text-gray-400 text-center">Aucun patient trouve</div>
                      ) : (
                        filteredPatients.slice(0, 20).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setSelectedPatient(p); setShowPatientDropdown(false); setPatientSearch(''); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-green-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <span className="font-medium text-gray-900">{p.last_name} {p.first_name}</span>
                            <span className="text-xs text-gray-400 ml-2">{p.patient_number}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Diagnostic</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Ex: Infection urinaire, Hypertension..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Medications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">Medicaments *</label>
                <button
                  type="button"
                  onClick={addMedication}
                  className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <div className="space-y-4">
                {medications.map((med, idx) => (
                  <div key={med.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase">Medicament {idx + 1}</span>
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedication(med.id)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Nom du medicament (ex: Amoxicilline 500mg)"
                        value={med.medication_name}
                        onChange={(e) => updateMedication(med.id, 'medication_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Dosage *</label>
                        <input
                          type="text"
                          placeholder="Ex: 1 comprime, 5ml, 2 gelules..."
                          value={med.dosage}
                          onChange={(e) => updateMedication(med.id, 'dosage', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Frequence *</label>
                        <select
                          value={med.frequency}
                          onChange={(e) => updateMedication(med.id, 'frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        >
                          <option value="">Selectionner</option>
                          {FREQUENCY_OPTIONS.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Duree *</label>
                        <select
                          value={med.duration}
                          onChange={(e) => updateMedication(med.id, 'duration', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        >
                          <option value="">Selectionner</option>
                          {DURATION_OPTIONS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Quantite</label>
                        <input
                          type="number"
                          min="1"
                          value={med.quantity}
                          onChange={(e) => updateMedication(med.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Instructions (optionnel)</label>
                      <input
                        type="text"
                        placeholder="Ex: Prendre pendant les repas, eviter l'alcool..."
                        value={med.instructions}
                        onChange={(e) => updateMedication(med.id, 'instructions', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes pour le pharmacien (optionnel)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observations ou instructions supplementaires..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !selectedPatient || medications.every(m => !m.medication_name.trim())}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {saving ? 'Enregistrement...' : 'Creer la prescription'}
          </button>
        </div>
      </div>
    </div>
  );
}
