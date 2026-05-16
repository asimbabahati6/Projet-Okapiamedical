import { useState } from 'react';
import {
  Stethoscope, BookOpen, ClipboardList, PlusCircle, X,
  FlaskConical, Pill, AlertTriangle, Heart, Thermometer,
  Activity, Weight, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DOCTOR_ROLES = ['doctor', 'medecin', 'admin', 'medical_director', 'medecin_chef_staff'];

interface ParaclinicalExam {
  id: string;
  name: string;
  completed: boolean;
}

interface VitalSigns {
  blood_pressure_systolic?: string;
  blood_pressure_diastolic?: string;
  heart_rate?: string;
  temperature?: string;
  weight?: string;
  oxygen_saturation?: string;
}

interface DoctorExaminationProps {
  medicalHistory: string;
  illnessHistory: string;
  additionalAnamnesis: string;
  physicalExamination: string;
  diagnosis: string;
  treatmentPlan: string;
  paraclinicalExams: ParaclinicalExam[];
  disabled: boolean;
  // ✅ Signes vitaux passés depuis la section infirmier
  vitalSigns?: VitalSigns;
  nurseComplaints?: string;
  onFieldChange: (field: string, value: string) => void;
  onParaclinicalChange: (exams: ParaclinicalExam[]) => void;
  onComplete: () => void;
}

// ─── Helpers signes vitaux ────────────────────────────────────────────────────
function getVitalStatus(vs: VitalSigns) {
  const alerts: { label: string; value: string; severity: 'warning' | 'danger' }[] = [];
  const sys = parseFloat(vs.blood_pressure_systolic || '');
  const dia = parseFloat(vs.blood_pressure_diastolic || '');
  const hr = parseFloat(vs.heart_rate || '');
  const temp = parseFloat(vs.temperature || '');
  const spo2 = parseFloat(vs.oxygen_saturation || '');

  if (!isNaN(sys)) {
    if (sys >= 180 || sys < 90) alerts.push({ label: 'Tension sys.', value: `${sys}`, severity: 'danger' });
    else if (sys >= 140) alerts.push({ label: 'Tension sys.', value: `${sys}`, severity: 'warning' });
  }
  if (!isNaN(dia)) {
    if (dia >= 120) alerts.push({ label: 'Tension dia.', value: `${dia}`, severity: 'danger' });
    else if (dia >= 90) alerts.push({ label: 'Tension dia.', value: `${dia}`, severity: 'warning' });
  }
  if (!isNaN(hr)) {
    if (hr >= 120 || hr < 40) alerts.push({ label: 'FC', value: `${hr} bpm`, severity: 'danger' });
    else if (hr >= 100 || hr < 60) alerts.push({ label: 'FC', value: `${hr} bpm`, severity: 'warning' });
  }
  if (!isNaN(temp)) {
    if (temp >= 40 || temp < 35) alerts.push({ label: 'Temp.', value: `${temp}°C`, severity: 'danger' });
    else if (temp >= 38.5) alerts.push({ label: 'Temp.', value: `${temp}°C`, severity: 'warning' });
  }
  if (!isNaN(spo2)) {
    if (spo2 < 90) alerts.push({ label: 'SpO2', value: `${spo2}%`, severity: 'danger' });
    else if (spo2 < 95) alerts.push({ label: 'SpO2', value: `${spo2}%`, severity: 'warning' });
  }

  return alerts;
}

function colorForValue(val: string, type: 'bp' | 'hr' | 'temp' | 'spo2' | 'weight'): string {
  const n = parseFloat(val);
  if (isNaN(n)) return 'text-gray-400';
  if (type === 'bp') {
    if (n >= 180 || n < 90) return 'text-red-600 font-bold';
    if (n >= 140) return 'text-amber-600 font-semibold';
    return 'text-green-700 font-semibold';
  }
  if (type === 'hr') {
    if (n >= 120 || n < 40) return 'text-red-600 font-bold';
    if (n >= 100 || n < 60) return 'text-amber-600 font-semibold';
    return 'text-green-700 font-semibold';
  }
  if (type === 'temp') {
    if (n >= 40 || n < 35) return 'text-red-600 font-bold';
    if (n >= 38.5) return 'text-amber-600 font-semibold';
    return 'text-green-700 font-semibold';
  }
  if (type === 'spo2') {
    if (n < 90) return 'text-red-600 font-bold';
    if (n < 95) return 'text-amber-600 font-semibold';
    return 'text-green-700 font-semibold';
  }
  return 'text-gray-800 font-semibold';
}

export function DoctorExamination({
  medicalHistory,
  illnessHistory,
  additionalAnamnesis,
  physicalExamination,
  diagnosis,
  treatmentPlan,
  paraclinicalExams,
  disabled,
  vitalSigns = {},
  nurseComplaints,
  onFieldChange,
  onParaclinicalChange,
  onComplete,
}: DoctorExaminationProps) {
  const { profile } = useAuth();
  const isDoctorRole = DOCTOR_ROLES.includes(profile?.role?.name || '');
  const isFieldDisabled = disabled || !isDoctorRole;

  const [newExam, setNewExam] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [validationError, setValidationError] = useState('');

  const vitalAlerts = getVitalStatus(vitalSigns);
  const hasUrgentAlerts = vitalAlerts.some(a => a.severity === 'danger');

  function addExam() {
    if (!newExam.trim()) return;
    const exam: ParaclinicalExam = {
      id: crypto.randomUUID(),
      name: newExam.trim(),
      completed: false,
    };
    onParaclinicalChange([...paraclinicalExams, exam]);
    setNewExam('');
  }

  function removeExam(id: string) {
    onParaclinicalChange(paraclinicalExams.filter(e => e.id !== id));
  }

  function toggleExam(id: string) {
    onParaclinicalChange(
      paraclinicalExams.map(e => e.id === id ? { ...e, completed: !e.completed } : e)
    );
  }

  // ✅ Validation avant clôture
  function handleCompleteClick() {
    if (!diagnosis.trim()) {
      setValidationError('Le diagnostic est obligatoire avant de clôturer.');
      return;
    }
    if (!treatmentPlan.trim()) {
      setValidationError('La conduite à tenir / traitement est obligatoire avant de clôturer.');
      return;
    }
    setValidationError('');
    setShowCloseConfirm(true);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-teal-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Section Médecin</h3>
          <p className="text-xs text-gray-500">Examen clinique et décision thérapeutique</p>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ✅ Résumé signes vitaux infirmier */}
        {(vitalSigns.heart_rate || vitalSigns.temperature || vitalSigns.blood_pressure_systolic) && (
          <div className={`rounded-xl border p-4 ${
            hasUrgentAlerts ? 'bg-red-50 border-red-200' :
            vitalAlerts.length > 0 ? 'bg-amber-50 border-amber-200' :
            'bg-teal-50 border-teal-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-xs font-semibold flex items-center gap-1.5 ${
                hasUrgentAlerts ? 'text-red-700' :
                vitalAlerts.length > 0 ? 'text-amber-700' :
                'text-teal-700'
              }`}>
                {hasUrgentAlerts ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Signes vitaux (infirmier)
                {vitalAlerts.length > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    hasUrgentAlerts ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                  }`}>
                    {vitalAlerts.length} alerte{vitalAlerts.length > 1 ? 's' : ''}
                  </span>
                )}
              </h4>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {vitalSigns.blood_pressure_systolic && (
                <VitalChip
                  icon={<Heart className="w-3 h-3 text-red-400" />}
                  label="TA"
                  value={`${vitalSigns.blood_pressure_systolic}${vitalSigns.blood_pressure_diastolic ? '/' + vitalSigns.blood_pressure_diastolic : ''}`}
                  unit="mmHg"
                  colorClass={colorForValue(vitalSigns.blood_pressure_systolic, 'bp')}
                />
              )}
              {vitalSigns.heart_rate && (
                <VitalChip
                  icon={<Activity className="w-3 h-3 text-orange-400" />}
                  label="FC"
                  value={vitalSigns.heart_rate}
                  unit="bpm"
                  colorClass={colorForValue(vitalSigns.heart_rate, 'hr')}
                />
              )}
              {vitalSigns.temperature && (
                <VitalChip
                  icon={<Thermometer className="w-3 h-3 text-amber-400" />}
                  label="Temp"
                  value={vitalSigns.temperature}
                  unit="°C"
                  colorClass={colorForValue(vitalSigns.temperature, 'temp')}
                />
              )}
              {vitalSigns.oxygen_saturation && (
                <VitalChip
                  icon={<Activity className="w-3 h-3 text-cyan-400" />}
                  label="SpO2"
                  value={vitalSigns.oxygen_saturation}
                  unit="%"
                  colorClass={colorForValue(vitalSigns.oxygen_saturation, 'spo2')}
                />
              )}
              {vitalSigns.weight && (
                <VitalChip
                  icon={<Weight className="w-3 h-3 text-blue-400" />}
                  label="Poids"
                  value={vitalSigns.weight}
                  unit="kg"
                  colorClass={colorForValue(vitalSigns.weight, 'weight')}
                />
              )}
            </div>

            {/* ✅ Plaintes infirmier rappelées */}
            {nurseComplaints && (
              <div className="mt-3 pt-3 border-t border-teal-100">
                <p className="text-[11px] text-gray-500 font-medium mb-1">Plaintes signalées par l'infirmier :</p>
                <p className="text-xs text-gray-700 italic">"{nurseComplaints}"</p>
              </div>
            )}
          </div>
        )}

        {/* Anamnesis Block */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-800">Anamnèse approfondie</h4>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Antécédents</label>
            <textarea
              value={medicalHistory}
              onChange={(e) => onFieldChange('medicalHistory', e.target.value)}
              placeholder="Antécédents médicaux, chirurgicaux, familiaux..."
              rows={2}
              disabled={isFieldDisabled}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Histoire de la maladie</label>
            <textarea
              value={illnessHistory}
              onChange={(e) => onFieldChange('illnessHistory', e.target.value)}
              placeholder="Début, circonstances d'apparition, évolution..."
              rows={3}
              disabled={isFieldDisabled}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Complément d'anamnèse</label>
            <textarea
              value={additionalAnamnesis}
              onChange={(e) => onFieldChange('additionalAnamnesis', e.target.value)}
              placeholder="Informations complémentaires..."
              rows={2}
              disabled={isFieldDisabled}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Physical Examination */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-800">Examen Physique</h4>
          </div>
          <textarea
            value={physicalExamination}
            onChange={(e) => onFieldChange('physicalExamination', e.target.value)}
            placeholder="Description de l'examen physique: inspection, palpation, percussion, auscultation..."
            rows={4}
            disabled={isFieldDisabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Diagnosis ✅ Champ obligatoire */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-800">
              Appréciation / Diagnostic <span className="text-red-400">*</span>
            </h4>
          </div>
          <textarea
            value={diagnosis}
            onChange={(e) => { onFieldChange('diagnosis', e.target.value); setValidationError(''); }}
            placeholder="Diagnostic principal, hypothèses diagnostiques..."
            rows={2}
            disabled={isFieldDisabled}
            className={`w-full px-4 py-2.5 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${
              validationError.includes('diagnostic') ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
        </div>

        {/* Action Plan */}
        <div className="space-y-4 p-4 bg-gray-50/70 rounded-xl border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Plan d'action
          </h4>

          {/* Paraclinical Exams */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="w-3.5 h-3.5 text-blue-500" />
              <label className="text-xs font-medium text-gray-600">Examens Paracliniques</label>
            </div>
            {!isFieldDisabled && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newExam}
                  onChange={(e) => setNewExam(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExam())}
                  placeholder="Ajouter un examen..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  onClick={addExam}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Ajouter
                </button>
              </div>
            )}
            {paraclinicalExams.length > 0 ? (
              <div className="space-y-1.5">
                {paraclinicalExams.map(exam => (
                  <div key={exam.id} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      checked={exam.completed}
                      onChange={() => toggleExam(exam.id)}
                      disabled={isFieldDisabled}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className={`flex-1 text-sm ${exam.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {exam.name}
                    </span>
                    {!isFieldDisabled && (
                      <button onClick={() => removeExam(exam.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Aucun examen paraclinique ajouté</p>
            )}
          </div>

          {/* Treatment ✅ Champ obligatoire */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-3.5 h-3.5 text-green-500" />
              <label className="text-xs font-medium text-gray-600">
                Traitement / Conduite à tenir <span className="text-red-400">*</span>
              </label>
            </div>
            <textarea
              value={treatmentPlan}
              onChange={(e) => { onFieldChange('treatmentPlan', e.target.value); setValidationError(''); }}
              placeholder="Prescriptions, recommandations, conduite à tenir..."
              rows={3}
              disabled={isFieldDisabled}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${
                validationError.includes('traitement') ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
          </div>
        </div>

        {/* ✅ Erreur de validation */}
        {validationError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {validationError}
          </div>
        )}

        {/* ✅ Modal confirmation clôture */}
        {showCloseConfirm && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm font-semibold text-blue-800 mb-1">Clôturer la consultation ?</p>
            <p className="text-xs text-blue-600 mb-3">
              Cette action est définitive. La fiche sera archivée et un rapport sera généré.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCloseConfirm(false); onComplete(); }}
                className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                Confirmer la clôture
              </button>
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 px-3 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Complete Button */}
        {!disabled && isDoctorRole && !showCloseConfirm && (
          <button
            onClick={handleCompleteClick}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm shadow-sm"
          >
            <ClipboardList className="w-4 h-4" />
            Clôturer la consultation
          </button>
        )}
      </div>
    </div>
  );
}

// ─── VitalChip ────────────────────────────────────────────────────────────────
function VitalChip({ icon, label, value, unit, colorClass }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  colorClass: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 px-2.5 py-2 flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
        {icon}
        {label}
      </div>
      <span className={`text-sm ${colorClass}`}>{value}</span>
      <span className="text-[9px] text-gray-300">{unit}</span>
    </div>
  );
}
