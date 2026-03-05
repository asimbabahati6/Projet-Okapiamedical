import { useState } from 'react';
import { Plus, X, Star, GripVertical, AlertCircle } from 'lucide-react';
import { ICD10Autocomplete } from './ICD10Autocomplete';

export interface DiagnosisInput {
  id: string;
  code: string;
  description: string;
  isFreeText: boolean;
  isPrimary: boolean;
  notes: string;
  icd10_code_id?: string;
}

interface MultipleDiagnosesInputProps {
  diagnoses: DiagnosisInput[];
  onChange: (diagnoses: DiagnosisInput[]) => void;
  required?: boolean;
}

export function MultipleDiagnosesInput({
  diagnoses,
  onChange,
  required = false
}: MultipleDiagnosesInputProps) {
  const [showAddForm, setShowAddForm] = useState(diagnoses.length === 0);
  const [newDiagnosis, setNewDiagnosis] = useState<{
    code: string;
    description: string;
    isFreeText: boolean;
    icd10_code_id?: string;
  } | null>(null);
  const [notes, setNotes] = useState('');

  function handleAdd() {
    if (!newDiagnosis) return;

    const diagnosis: DiagnosisInput = {
      id: crypto.randomUUID(),
      code: newDiagnosis.code,
      description: newDiagnosis.description,
      isFreeText: newDiagnosis.isFreeText,
      isPrimary: diagnoses.length === 0, // First diagnosis is primary by default
      notes: notes.trim(),
      icd10_code_id: newDiagnosis.icd10_code_id
    };

    onChange([...diagnoses, diagnosis]);
    setNewDiagnosis(null);
    setNotes('');
    setShowAddForm(false);
  }

  function handleRemove(id: string) {
    const updated = diagnoses.filter(d => d.id !== id);
    // If we removed the primary diagnosis, make the first one primary
    if (updated.length > 0 && !updated.some(d => d.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  }

  function handleSetPrimary(id: string) {
    const updated = diagnoses.map(d => ({
      ...d,
      isPrimary: d.id === id
    }));
    onChange(updated);
  }

  function handleNotesChange(id: string, notes: string) {
    const updated = diagnoses.map(d =>
      d.id === id ? { ...d, notes } : d
    );
    onChange(updated);
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const updated = [...diagnoses];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  }

  function handleMoveDown(index: number) {
    if (index === diagnoses.length - 1) return;
    const updated = [...diagnoses];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  }

  const hasValidDiagnosis = newDiagnosis && (newDiagnosis.description.trim().length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Diagnostics {required && <span className="text-red-500">*</span>}
        </label>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un diagnostic
          </button>
        )}
      </div>

      {required && diagnoses.length === 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Au moins un diagnostic est requis pour enregistrer la consultation.
          </p>
        </div>
      )}

      {diagnoses.length > 0 && (
        <div className="space-y-2">
          {diagnoses.map((diagnosis, index) => (
            <div
              key={diagnosis.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Monter"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-700">
                          #{index + 1}
                        </span>
                        {!diagnosis.isFreeText && diagnosis.code && (
                          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono font-semibold rounded">
                            {diagnosis.code}
                          </span>
                        )}
                        {diagnosis.isFreeText && (
                          <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                            Texte libre
                          </span>
                        )}
                        {diagnosis.isPrimary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                            <Star className="w-3 h-3 fill-current" />
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-900">{diagnosis.description}</p>
                      {diagnosis.notes && (
                        <p className="mt-1 text-xs text-gray-600 italic">
                          Note: {diagnosis.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!diagnosis.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(diagnosis.id)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          title="Définir comme diagnostic principal"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(diagnosis.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              Nouveau diagnostic
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewDiagnosis(null);
                setNotes('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <ICD10Autocomplete
            value={newDiagnosis}
            onChange={setNewDiagnosis}
            placeholder="Rechercher un code ICD-10 ou entrer du texte libre..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notes supplémentaires sur ce diagnostic..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewDiagnosis(null);
                setNotes('');
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!hasValidDiagnosis}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
