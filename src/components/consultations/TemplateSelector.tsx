import { useState, useEffect } from 'react';
import { FileText, Star, Users, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ConsultationTemplate } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

interface TemplateSelectorProps {
  onSelect: (template: ConsultationTemplate) => void;
  selectedTemplateId?: string | null;
  specialty?: string;
}

export function TemplateSelector({ onSelect, selectedTemplateId, specialty }: TemplateSelectorProps) {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<ConsultationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'system' | 'personal'>('all');

  useEffect(() => {
    fetchTemplates();
  }, [filter, specialty]);

  async function fetchTemplates() {
    setLoading(true);
    try {
      let query = supabase
        .from('consultation_templates')
        .select('*')
        .order('usage_count', { ascending: false });

      if (filter === 'system') {
        query = query.eq('is_system_template', true);
      } else if (filter === 'personal') {
        query = query.eq('created_by', profile?.id).eq('is_system_template', false);
      }

      if (specialty) {
        query = query.eq('specialty', specialty);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTemplates = templates;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Template de consultation (optionnel)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Sélectionnez un template pour pré-remplir les champs de la consultation
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tous
        </button>
        <button
          type="button"
          onClick={() => setFilter('system')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'system'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Système
        </button>
        <button
          type="button"
          onClick={() => setFilter('personal')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'personal'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Personnel
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Aucun template trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className={`text-left p-4 border-2 rounded-lg transition-all hover:border-blue-300 ${
                selectedTemplateId === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">
                      {template.name}
                    </h4>
                    {selectedTemplateId === template.id && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      {template.specialty}
                    </span>
                    {template.is_system_template ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                        <Star className="w-3 h-3" />
                        Système
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        Personnel
                      </span>
                    )}
                    {template.is_shared && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        <Users className="w-3 h-3" />
                        Partagé
                      </span>
                    )}
                  </div>

                  {template.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Utilisé {template.usage_count} fois</span>
                    {template.suggested_diagnoses && template.suggested_diagnoses.length > 0 && (
                      <span>{template.suggested_diagnoses.length} diagnostic(s) suggéré(s)</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedTemplateId && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Check className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-blue-900">
            Template sélectionné. Les champs seront pré-remplis avec le contenu du template.
          </p>
        </div>
      )}
    </div>
  );
}
