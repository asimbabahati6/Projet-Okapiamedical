import { useState } from 'react';
import { Stethoscope, BookOpen, ClipboardList, PlusCircle, X, FlaskConical, Pill } from 'lucide-react';

interface ParaclinicalExam {
  id: string;
  name: string;
  completed: boolean;
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
  onFieldChange: (field: string, value: string) => void;
  onParaclinicalChange: (exams: ParaclinicalExam[]) => void;
  onComplete: () => void;
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
  onFieldChange,
  onParaclinicalChange,
  onComplete,
}: DoctorExaminationProps) {
  const [newExam, setNewExam] = useState('');

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

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
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
            disabled={disabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Diagnosis */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-800">Appréciation / Diagnostic</h4>
          </div>
          <textarea
            value={diagnosis}
            onChange={(e) => onFieldChange('diagnosis', e.target.value)}
            placeholder="Diagnostic principal, hypothèses diagnostiques..."
            rows={2}
            disabled={disabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
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
            {!disabled && (
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
                      disabled={disabled}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className={`flex-1 text-sm ${exam.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {exam.name}
                    </span>
                    {!disabled && (
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

          {/* Treatment */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-3.5 h-3.5 text-green-500" />
              <label className="text-xs font-medium text-gray-600">Traitement / Conduite à tenir</label>
            </div>
            <textarea
              value={treatmentPlan}
              onChange={(e) => onFieldChange('treatmentPlan', e.target.value)}
              placeholder="Prescriptions, recommandations, conduite à tenir..."
              rows={3}
              disabled={disabled}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Complete Button */}
        {!disabled && (
          <button
            onClick={onComplete}
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
