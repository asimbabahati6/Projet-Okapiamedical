import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, User } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  patient_number: string;
  date_of_birth: string;
}

const EXAM_TYPES = [
  { value: 'radiography', label: 'Radiographie', modality: 'CR' },
  { value: 'ct_scan', label: 'Scanner (CT)', modality: 'CT' },
  { value: 'mri', label: 'IRM', modality: 'MR' },
  { value: 'ultrasound', label: 'Échographie', modality: 'US' },
  { value: 'mammography', label: 'Mammographie', modality: 'MG' }
];

const BODY_PARTS = [
  'Crâne', 'Cerveau', 'Thorax', 'Poumons', 'Abdomen', 'Bassin',
  'Colonne vertébrale', 'Membre supérieur', 'Membre inférieur', 'Autre'
];

const URGENCY_LEVELS = [
  { value: 'routine', label: 'Routine', color: 'bg-gray-100 text-gray-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-orange-100 text-orange-800' },
  { value: 'emergency', label: 'Urgence', color: 'bg-red-100 text-red-800' }
];

export default function PrescribeExamPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    exam_type: '',
    modality: '',
    body_part: '',
    clinical_info: '',
    urgency_level: 'routine',
    special_instructions: ''
  });

  const searchPatients = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, patient_number, date_of_birth')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,patient_number.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleExamTypeChange = (value: string) => {
    const examType = EXAM_TYPES.find(t => t.value === value);
    setFormData({
      ...formData,
      exam_type: value,
      modality: examType?.modality || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !formData.exam_type) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('radiology_exams')
        .insert({
          patient_id: selectedPatient.id,
          prescribed_by: profile?.id,
          exam_type: formData.exam_type,
          modality: formData.modality,
          body_part: formData.body_part,
          clinical_info: formData.clinical_info,
          urgency_level: formData.urgency_level,
          special_instructions: formData.special_instructions,
          status: 'prescribed'
        });

      if (error) throw error;

      alert('Examen prescrit avec succès !');
      navigate('/staff/radiology');
    } catch (error) {
      console.error('Error prescribing exam:', error);
      alert('Erreur lors de la prescription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/staff/radiology')}
          className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour au Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Prescrire un Examen Radiologique
          </h1>

          {!selectedPatient ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Rechercher un Patient
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPatients()}
                  placeholder="Nom, prénom ou n° patient..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <button
                  onClick={searchPatients}
                  disabled={searching}
                  className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  {searching ? 'Recherche...' : 'Rechercher'}
                </button>
              </div>

              {patients.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">{patients.length} patient(s) trouvé(s)</p>
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className="w-full p-4 bg-gray-50 hover:bg-cyan-50 rounded-lg border border-gray-200 hover:border-cyan-300 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            N° {patient.patient_number} • Né(e) le {new Date(patient.date_of_birth).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                <p className="text-sm text-gray-600 mb-1">Patient sélectionné</p>
                <p className="font-semibold text-gray-900">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </p>
                <p className="text-sm text-gray-600">N° {selectedPatient.patient_number}</p>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="text-sm text-cyan-600 hover:text-cyan-700 mt-2"
                >
                  Changer de patient
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'Examen *
                </label>
                <select
                  required
                  value={formData.exam_type}
                  onChange={(e) => handleExamTypeChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Sélectionner un type...</option>
                  {EXAM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} ({type.modality})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partie du Corps *
                </label>
                <select
                  required
                  value={formData.body_part}
                  onChange={(e) => setFormData({ ...formData, body_part: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Sélectionner...</option>
                  {BODY_PARTS.map((part) => (
                    <option key={part} value={part}>{part}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau d'Urgence *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {URGENCY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, urgency_level: level.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.urgency_level === level.value
                          ? 'border-cyan-500 ' + level.color
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">{level.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renseignements Cliniques *
                </label>
                <textarea
                  required
                  value={formData.clinical_info}
                  onChange={(e) => setFormData({ ...formData, clinical_info: e.target.value })}
                  rows={4}
                  placeholder="Motif de l'examen, symptômes, contexte clinique..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions Spéciales
                </label>
                <textarea
                  value={formData.special_instructions}
                  onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                  rows={3}
                  placeholder="Précautions, produit de contraste, préparation..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {submitting ? 'Prescription en cours...' : 'Prescrire l\'Examen'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/staff/radiology')}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
