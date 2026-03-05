import { useState, useEffect, useCallback } from 'react';
import { Save, Clock, CheckCircle, FileText } from 'lucide-react';

interface ReportSection {
  id: string;
  label: string;
  content: string;
  required?: boolean;
  placeholder?: string;
}

interface ReportEditorProps {
  reportId: string;
  initialData?: ReportSection[];
  onSave: (data: ReportSection[]) => Promise<void>;
  readOnly?: boolean;
  autoSaveInterval?: number;
}

export default function ReportEditor({
  reportId,
  initialData = [],
  onSave,
  readOnly = false,
  autoSaveInterval = 30000
}: ReportEditorProps) {
  const [sections, setSections] = useState<ReportSection[]>(
    initialData.length > 0
      ? initialData
      : [
          {
            id: 'technique',
            label: 'Technique',
            content: '',
            required: true,
            placeholder: 'Décrire la technique utilisée pour cet examen...'
          },
          {
            id: 'findings',
            label: 'Constatations',
            content: '',
            required: true,
            placeholder: 'Décrire les observations radiologiques détaillées...'
          },
          {
            id: 'conclusion',
            label: 'Conclusion',
            content: '',
            required: true,
            placeholder: 'Conclusion diagnostique et recommandations...'
          }
        ]
  );

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!readOnly && autoSaveInterval > 0) {
      const interval = setInterval(() => {
        if (hasChanges) {
          handleSave(true);
        }
      }, autoSaveInterval);

      return () => clearInterval(interval);
    }
  }, [hasChanges, autoSaveInterval, readOnly]);

  const handleContentChange = (sectionId: string, newContent: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, content: newContent } : section
      )
    );
    setHasChanges(true);
  };

  const handleSave = useCallback(
    async (isAutoSave = false) => {
      if (readOnly) return;

      setSaving(true);
      try {
        await onSave(sections);
        setLastSaved(new Date());
        setHasChanges(false);
      } catch (error) {
        console.error('Error saving report:', error);
      } finally {
        setSaving(false);
      }
    },
    [sections, onSave, readOnly]
  );

  const getCharCount = (content: string) => {
    return content.length;
  };

  const validateSection = (section: ReportSection) => {
    if (section.required && !section.content.trim()) {
      return false;
    }
    return true;
  };

  const isFormValid = sections.every(validateSection);

  return (
    <div className="space-y-6">
      {/* Header with Save Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-cyan-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Compte-rendu</h3>
            {lastSaved && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Sauvegardé à {lastSaved.toLocaleTimeString('fr-FR')}
              </p>
            )}
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-amber-600 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Modifications non sauvegardées
              </span>
            )}
            <button
              onClick={() => handleSave(false)}
              disabled={saving || !hasChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                saving || !hasChanges
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-cyan-600 text-white hover:bg-cyan-700'
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer brouillon
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Report Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-900">
                {section.label}
                {section.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <span className="text-xs text-gray-500">
                {getCharCount(section.content)} caractères
              </span>
            </div>

            <textarea
              value={section.content}
              onChange={(e) => handleContentChange(section.id, e.target.value)}
              placeholder={section.placeholder}
              disabled={readOnly}
              rows={8}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${
                readOnly
                  ? 'bg-gray-50 text-gray-700 cursor-not-allowed'
                  : 'border-gray-300 hover:border-cyan-300'
              } ${
                section.required && !validateSection(section)
                  ? 'border-red-300 bg-red-50'
                  : ''
              }`}
            />

            {section.required && !validateSection(section) && (
              <p className="mt-2 text-sm text-red-600">Ce champ est obligatoire</p>
            )}
          </div>
        ))}
      </div>

      {/* Validation Alert */}
      {!readOnly && !isFormValid && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
          <p className="text-sm text-amber-800">
            Veuillez remplir tous les champs obligatoires avant de soumettre le rapport.
          </p>
        </div>
      )}

      {readOnly && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            Ce rapport est en mode lecture seule. Vous ne pouvez pas le modifier.
          </p>
        </div>
      )}
    </div>
  );
}
