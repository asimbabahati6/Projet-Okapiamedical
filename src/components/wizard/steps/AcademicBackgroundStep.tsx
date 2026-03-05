import { useState } from 'react';
import { Plus, Trash2, GraduationCap, AlertCircle } from 'lucide-react';
import {
  AcademicBackgroundData,
  AcademicBackgroundEntry,
  EducationLevel,
  ValidationError,
} from '../../../types/employeeForm';
import { FormField } from '../FormField';
import { SelectField } from '../SelectField';
import { YearSelector } from '../YearSelector';
import { SkillsTagInput } from '../SkillsTagInput';

interface AcademicBackgroundStepProps {
  data: AcademicBackgroundData;
  onChange: (data: Partial<AcademicBackgroundData>) => void;
  errors: ValidationError[];
}

const EDUCATION_LEVEL_OPTIONS = [
  { value: EducationLevel.BAC, label: 'Bac' },
  { value: EducationLevel.BAC_PLUS_2, label: 'Bac+2' },
  { value: EducationLevel.LICENCE, label: 'Licence' },
  { value: EducationLevel.MASTER, label: 'Master' },
  { value: EducationLevel.DOCTORAT, label: 'Doctorat' },
];

export function AcademicBackgroundStep({
  data,
  onChange,
  errors,
}: AcademicBackgroundStepProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const addEducationEntry = () => {
    const newEntry: AcademicBackgroundEntry = {
      id: crypto.randomUUID(),
      educationLevel: '',
      degreeTitle: '',
      institution: '',
      graduationYear: '',
      keySkills: [],
    };

    onChange({
      educationEntries: [...data.educationEntries, newEntry],
    });
  };

  const removeEducationEntry = (id: string) => {
    onChange({
      educationEntries: data.educationEntries.filter((entry) => entry.id !== id),
    });
    setConfirmDelete(null);
  };

  const updateEducationEntry = (id: string, updates: Partial<AcademicBackgroundEntry>) => {
    onChange({
      educationEntries: data.educationEntries.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Parcours Académique</h2>
        <p className="text-gray-600">
          Ajoutez les formations et diplômes obtenus par l'employé (optionnel)
        </p>
      </div>

      {data.educationEntries.length === 0 ? (
        <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-8 text-center">
          <GraduationCap className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Aucune formation renseignée</p>
          <button
            type="button"
            onClick={addEducationEntry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter une formation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.educationEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Formation {index + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(entry.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Supprimer cette formation"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  label="Niveau d'études"
                  name={`educationLevel-${entry.id}`}
                  value={entry.educationLevel}
                  onChange={(e) =>
                    updateEducationEntry(entry.id, {
                      educationLevel: e.target.value as EducationLevel,
                    })
                  }
                  options={EDUCATION_LEVEL_OPTIONS}
                  error={getError(`educationEntries[${index}].educationLevel`)}
                  required
                />

                <YearSelector
                  label="Année d'obtention"
                  value={entry.graduationYear}
                  onChange={(year) =>
                    updateEducationEntry(entry.id, { graduationYear: year })
                  }
                  error={getError(`educationEntries[${index}].graduationYear`)}
                  required
                />

                <FormField
                  label="Titre du diplôme"
                  name={`degreeTitle-${entry.id}`}
                  value={entry.degreeTitle}
                  onChange={(e) =>
                    updateEducationEntry(entry.id, { degreeTitle: e.target.value })
                  }
                  error={getError(`educationEntries[${index}].degreeTitle`)}
                  required
                  placeholder="Ex: Licence en Informatique"
                />

                <FormField
                  label="Établissement"
                  name={`institution-${entry.id}`}
                  value={entry.institution}
                  onChange={(e) =>
                    updateEducationEntry(entry.id, { institution: e.target.value })
                  }
                  error={getError(`educationEntries[${index}].institution`)}
                  required
                  placeholder="Ex: Université de Kinshasa"
                />

                <div className="md:col-span-2">
                  <SkillsTagInput
                    label="Compétences clés (optionnel)"
                    value={entry.keySkills}
                    onChange={(skills) =>
                      updateEducationEntry(entry.id, { keySkills: skills })
                    }
                    placeholder="Ex: Programmation, Gestion de projet..."
                    error={getError(`educationEntries[${index}].keySkills`)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addEducationEntry}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter une autre formation
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Supprimer cette formation?
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              Cette action est irréversible. La formation et toutes ses informations seront
              définitivement supprimées.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => removeEducationEntry(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
