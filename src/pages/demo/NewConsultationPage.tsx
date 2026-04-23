import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Save, Send, ChevronLeft, Plus, Trash2,
  Thermometer, Activity, Heart, Wind, Weight, Ruler,
  FlaskConical, Pill, User, Calendar, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useWorkflow, type PrescriptionItem } from '../../contexts/WorkflowContext';

// ---------------------------------------------------------------------------
// Sub-types
// ---------------------------------------------------------------------------

interface MedItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_PATIENTS = [
  { id: 'p1', label: 'PAT-001 — Jean-Paul Mbala' },
  { id: 'p2', label: 'PAT-002 — Marie-Claire Tshisekedi' },
  { id: 'p3', label: 'PAT-003 — Alain Ilunga' },
  { id: 'p4', label: 'PAT-004 — Sophie Kabila' },
  { id: 'p5', label: 'PAT-005 — Michel Lumumba' },
];

const COMMON_TESTS = [
  'NFS complète', 'Frottis sanguin', 'CRP', 'VS',
  'Glycémie à jeun', 'Hépatobilan', 'Ionogramme', 'Créatinine',
  'Urée', 'Lipase', 'Amylase', 'TSH', 'T4 libre',
  'Sérologie HIV', 'Sérologie Hépatite B', 'Ag HBs',
  'ECBU', 'Coproculture', 'Hémoculture',
];

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function VitalInput({
  icon: Icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  unit,
  step,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  unit: string;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          step={step}
          className="w-full px-3 py-2 pr-12 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">{unit}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function NewConsultationPage() {
  const navigate = useNavigate();
  const { addConsultation } = useWorkflow();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Base form
  const [form, setForm] = useState({
    patient_id: '',
    consultation_type: 'initial',
    consultation_status: 'en_cours' as const,
    chief_complaint: '',
    history_of_present_illness: '',
    physical_examination: '',
    diagnosis: '',
    treatment_plan: '',
    notes: '',
    follow_up_date: '',
    priority: 'normal' as 'normal' | 'urgent' | 'stat',
  });

  // Vitals
  const [vitals, setVitals] = useState({
    temperature: '',
    bp_systolic: '',
    bp_diastolic: '',
    heart_rate: '',
    resp_rate: '',
    weight: '',
    height: '',
  });

  // Lab tests
  const [labTests, setLabTests] = useState<string[]>([]);
  const [customTest, setCustomTest] = useState('');

  // Medications
  const [medications, setMedications] = useState<MedItem[]>([]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => { const n = { ...e }; delete n[name]; return n; });
  }

  function handleVitalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setVitals(v => ({ ...v, [name]: value }));
  }

  function toggleTest(test: string) {
    setLabTests(prev =>
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    );
  }

  function addCustomTest() {
    const t = customTest.trim();
    if (t && !labTests.includes(t)) {
      setLabTests(prev => [...prev, t]);
      setCustomTest('');
    }
  }

  function addMedication() {
    setMedications(prev => [...prev, {
      id: crypto.randomUUID(),
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
    }]);
  }

  function updateMed(id: string, field: keyof MedItem, value: string) {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  }

  function removeMed(id: string) {
    setMedications(prev => prev.filter(m => m.id !== id));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.patient_id) e.patient_id = 'Sélectionnez un patient';
    if (!form.chief_complaint.trim()) e.chief_complaint = 'Le motif de consultation est requis';
    if (!form.diagnosis.trim()) e.diagnosis = 'Le diagnostic est requis';
    if (!form.treatment_plan.trim()) e.treatment_plan = 'Le plan de traitement est requis';
    // Validate medications
    for (const m of medications) {
      if (!m.name.trim()) { e.medications = 'Chaque médicament doit avoir un nom'; break; }
    }
    return e;
  }

  function handleSaveDraft() {
    const patient = MOCK_PATIENTS.find(p => p.id === form.patient_id);
    addConsultation({
      patient_id: form.patient_id,
      patient_name: patient?.label.split('—')[1]?.trim() ?? 'Patient inconnu',
      doctor_name: 'Dr. Amani Katebe',
      consultation_type: form.consultation_type,
      consultation_status: 'brouillon',
      chief_complaint: form.chief_complaint || '(brouillon)',
      diagnosis: form.diagnosis || '',
      treatment_plan: form.treatment_plan || '',
    });
    navigate('/demo');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600)); // simulate async

    const patient = MOCK_PATIENTS.find(p => p.id === form.patient_id)!;

    const meds: PrescriptionItem[] = medications
      .filter(m => m.name.trim())
      .map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
      }));

    addConsultation({
      patient_id: form.patient_id,
      patient_name: patient.label.split('—')[1]?.trim() ?? patient.label,
      doctor_name: 'Dr. Amani Katebe',
      consultation_type: form.consultation_type,
      consultation_status: 'terminee',
      chief_complaint: form.chief_complaint,
      diagnosis: form.diagnosis,
      treatment_plan: form.treatment_plan,
      lab_tests: labTests,
      medications: meds,
      priority: form.priority,
    });

    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => navigate('/demo'), 2000);
  }

  // ---------------------------------------------------------------------------
  // Success screen
  // ---------------------------------------------------------------------------

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Consultation enregistrée</h2>
        <p className="text-gray-500 max-w-sm">
          {labTests.length > 0 && `${labTests.length} demande(s) d'examen envoyée(s) au laboratoire. `}
          {medications.length > 0 && `${medications.length} ordonnance(s) transmise(s) à la pharmacie.`}
        </p>
        <p className="text-sm text-gray-400">Redirection en cours…</p>
      </div>
    );
  }

  const bmi = vitals.weight && vitals.height
    ? (parseFloat(vitals.weight) / Math.pow(parseInt(vitals.height) / 100, 2)).toFixed(1)
    : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/demo')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nouvelle Consultation</h1>
            <p className="text-xs text-gray-500">Dr. Amani Katebe — {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* 1. Informations de base */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionTitle icon={User} title="Informations de base" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Patient <span className="text-red-500">*</span>
            </label>
            <select
              name="patient_id"
              value={form.patient_id}
              onChange={handleChange}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors ${errors.patient_id ? 'border-red-300' : 'border-gray-200'}`}
            >
              <option value="">Sélectionner un patient…</option>
              {MOCK_PATIENTS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            {errors.patient_id && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.patient_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Type de consultation</label>
            <select
              name="consultation_type"
              value={form.consultation_type}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
            >
              <option value="initial">Première consultation</option>
              <option value="follow_up">Consultation de suivi</option>
              <option value="routine">Routine / Contrôle</option>
              <option value="emergency">Urgence</option>
              <option value="telemedicine">Télémédecine</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Priorité</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT (immédiat)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Date de suivi (optionnel)</span>
            </label>
            <input
              type="date"
              name="follow_up_date"
              value={form.follow_up_date}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 2. Motif + Histoire */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <SectionTitle icon={FileText} title="Motif de consultation" subtitle="Plainte principale et histoire de la maladie" />

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Motif / Plainte principale <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="chief_complaint"
            value={form.chief_complaint}
            onChange={handleChange}
            placeholder="Ex : Fièvre persistante depuis 3 jours avec frissons"
            className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors ${errors.chief_complaint ? 'border-red-300' : 'border-gray-200'}`}
          />
          {errors.chief_complaint && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.chief_complaint}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Histoire de la maladie actuelle</label>
          <textarea
            name="history_of_present_illness"
            value={form.history_of_present_illness}
            onChange={handleChange}
            rows={4}
            placeholder="Décrivez l'évolution chronologique des symptômes, les facteurs déclenchants, les traitements déjà pris…"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors resize-none"
          />
        </div>
      </div>

      {/* 3. Signes vitaux */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionTitle icon={Activity} title="Signes vitaux" subtitle="Paramètres mesurés lors de la consultation" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <VitalInput icon={Thermometer} label="Température" name="temperature" value={vitals.temperature} onChange={handleVitalChange} placeholder="37.0" unit="°C" step="0.1" />
          <VitalInput icon={Activity} label="TA Systolique" name="bp_systolic" value={vitals.bp_systolic} onChange={handleVitalChange} placeholder="120" unit="mmHg" />
          <VitalInput icon={Activity} label="TA Diastolique" name="bp_diastolic" value={vitals.bp_diastolic} onChange={handleVitalChange} placeholder="80" unit="mmHg" />
          <VitalInput icon={Heart} label="Fréq. cardiaque" name="heart_rate" value={vitals.heart_rate} onChange={handleVitalChange} placeholder="72" unit="bpm" />
          <VitalInput icon={Wind} label="Fréq. respiratoire" name="resp_rate" value={vitals.resp_rate} onChange={handleVitalChange} placeholder="16" unit="/min" />
          <VitalInput icon={Weight} label="Poids" name="weight" value={vitals.weight} onChange={handleVitalChange} placeholder="70" unit="kg" step="0.1" />
          <VitalInput icon={Ruler} label="Taille" name="height" value={vitals.height} onChange={handleVitalChange} placeholder="170" unit="cm" />

          {bmi && (
            <div className="flex items-center">
              <div className={`w-full px-3 py-2.5 rounded-lg border ${
                parseFloat(bmi) < 18.5 ? 'bg-blue-50 border-blue-200' :
                parseFloat(bmi) < 25 ? 'bg-emerald-50 border-emerald-200' :
                parseFloat(bmi) < 30 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="text-xs font-medium text-gray-500 mb-0.5">IMC</div>
                <div className={`text-xl font-bold ${
                  parseFloat(bmi) < 18.5 ? 'text-blue-700' :
                  parseFloat(bmi) < 25 ? 'text-emerald-700' :
                  parseFloat(bmi) < 30 ? 'text-amber-700' : 'text-red-700'
                }`}>{bmi}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {parseFloat(bmi) < 18.5 ? 'Insuffisance pondérale' :
                   parseFloat(bmi) < 25 ? 'Poids normal' :
                   parseFloat(bmi) < 30 ? 'Surpoids' : 'Obésité'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Examen physique */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionTitle icon={Activity} title="Examen physique" subtitle="Résultats de l'examen clinique par appareils" />
        <textarea
          name="physical_examination"
          value={form.physical_examination}
          onChange={handleChange}
          rows={5}
          placeholder="Général : bon état général, conscient, orienté…&#10;Cardiovasculaire : bruits du cœur réguliers, pas de souffle…&#10;Pulmonaire : murmure vésiculaire présent bilatéralement…&#10;Abdomen : souple, non douloureux à la palpation…"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors resize-none"
        />
      </div>

      {/* 5. Diagnostic */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionTitle icon={FileText} title="Diagnostic" subtitle="Diagnostic retenu (texte libre ou code ICD-10)" />
        <textarea
          name="diagnosis"
          value={form.diagnosis}
          onChange={handleChange}
          rows={3}
          placeholder="Ex : Paludisme simple confirmé (B54) — Accès fébrile non compliqué à Plasmodium falciparum"
          className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors resize-none ${errors.diagnosis ? 'border-red-300' : 'border-gray-200'}`}
        />
        {errors.diagnosis && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.diagnosis}</p>}
      </div>

      {/* 6. Plan de traitement */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionTitle icon={FileText} title="Plan de traitement" subtitle="Thérapeutique, recommandations, conseils hygiéno-diététiques" />
        <textarea
          name="treatment_plan"
          value={form.treatment_plan}
          onChange={handleChange}
          rows={4}
          placeholder="Médicaments, posologies, durées…&#10;Mesures non médicamenteuses…&#10;Recommandations au patient…&#10;Critères de consultation urgente…"
          className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors resize-none ${errors.treatment_plan ? 'border-red-300' : 'border-gray-200'}`}
        />
        {errors.treatment_plan && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.treatment_plan}</p>}
      </div>

      {/* 7. Demandes d'examens labo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionTitle icon={FlaskConical} title="Demandes d'examens de laboratoire" subtitle="Sélectionnez les examens ou ajoutez-en un personnalisé" />

        <div className="flex flex-wrap gap-2 mb-4">
          {COMMON_TESTS.map(test => (
            <button
              key={test}
              type="button"
              onClick={() => toggleTest(test)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                labTests.includes(test)
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {labTests.includes(test) ? '✓ ' : ''}{test}
            </button>
          ))}
        </div>

        {/* Custom test */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customTest}
            onChange={e => setCustomTest(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTest(); } }}
            placeholder="Ajouter un examen personnalisé…"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addCustomTest}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {labTests.length > 0 && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
            <p className="text-xs font-semibold text-emerald-700 mb-1.5">Examens sélectionnés ({labTests.length}) :</p>
            <div className="flex flex-wrap gap-1.5">
              {labTests.map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-md">
                  {t}
                  <button type="button" onClick={() => toggleTest(t)} className="hover:text-emerald-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 8. Ordonnance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <SectionTitle icon={Pill} title="Ordonnance médicale" subtitle="Médicaments prescrits au patient" />
          <button
            type="button"
            onClick={addMedication}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter un médicament
          </button>
        </div>

        {medications.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            <Pill className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun médicament ajouté</p>
            <button
              type="button"
              onClick={addMedication}
              className="mt-2 text-xs text-orange-500 hover:text-orange-600 underline"
            >
              Ajouter un médicament
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {medications.map((med, idx) => (
              <div key={med.id} className="p-4 bg-orange-50/60 border border-orange-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-orange-700">Médicament {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeMed(med.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nom du médicament *</label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={e => updateMed(med.id, 'name', e.target.value)}
                      placeholder="Ex : Amoxicilline 500mg"
                      className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={e => updateMed(med.id, 'dosage', e.target.value)}
                      placeholder="Ex : 1 comprimé"
                      className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Fréquence</label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={e => updateMed(med.id, 'frequency', e.target.value)}
                      placeholder="Ex : 3x/jour après repas"
                      className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Durée</label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={e => updateMed(med.id, 'duration', e.target.value)}
                      placeholder="Ex : 7 jours"
                      className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
            {errors.medications && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.medications}</p>}
          </div>
        )}
      </div>

      {/* 9. Notes additionnelles */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes additionnelles</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Observations complémentaires, informations de contexte, instructions particulières…"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors resize-none"
        />
      </div>

      {/* Submit bar */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 rounded-t-2xl p-4 flex items-center justify-between gap-3 shadow-lg">
        <div className="text-xs text-gray-500">
          {labTests.length > 0 && (
            <span className="inline-flex items-center gap-1 mr-3">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-500" />
              {labTests.length} examen(s) → Laboratoire
            </span>
          )}
          {medications.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Pill className="w-3.5 h-3.5 text-orange-500" />
              {medications.length} médicament(s) → Pharmacie
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            Brouillon
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Enregistrement…' : 'Enregistrer et transmettre'}
          </button>
        </div>
      </div>
    </form>
  );
}
