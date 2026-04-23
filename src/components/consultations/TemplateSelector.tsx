import { useState, useEffect } from 'react';
import { FileText, Star, Users, Check, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ConsultationTemplate, Department } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

interface TemplateSelectorProps {
  onSelect: (template: ConsultationTemplate) => void;
  selectedTemplateId?: string | null;
  /** Filtre optionnel par spécialité (texte libre). */
  specialty?: string;
  /** Filtre par département — si absent, utilise le département du médecin connecté. */
  departmentId?: string | null;
}

type FilterTab = 'all' | 'department' | 'system' | 'personal';

export function TemplateSelector({
  onSelect,
  selectedTemplateId,
  specialty,
  departmentId,
}: TemplateSelectorProps) {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<ConsultationTemplate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('department');

  // Le département actif : prop explicite > département du médecin connecté
  const activeDepartmentId = departmentId ?? profile?.department_id ?? null;

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [filter, specialty, activeDepartmentId]);

  async function fetchDepartments() {
    const { data } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    if (data) setDepartments(data as Department[]);
  }

  async function fetchTemplates() {
    setLoading(true);
    try {
      let query = supabase
        .from('consultation_templates')
        .select('*, department:departments(id, name)')
        .order('usage_count', { ascending: false });

      if (filter === 'department') {
        if (activeDepartmentId) {
          // Templates du service OU templates globaux partagés
          query = query.or(`department_id.eq.${activeDepartmentId},department_id.is.null`);
        }
      } else if (filter === 'system') {
        query = query.eq('is_system_template', true);
      } else if (filter === 'personal') {
        query = query.eq('created_by', profile?.id).eq('is_system_template', false);
      }
      // 'all' → pas de filtre supplémentaire

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

  function getDepartmentName(deptId: string | null): string | null {
    if (!deptId) return null;
    return departments.find(d => d.id === deptId)?.name ?? null;
  }

  const activeDeptName = getDepartmentName(activeDepartmentId);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'department', label: activeDeptName ? `Mon service` : 'Mon service' },
    { key: 'all', label: 'Tous' },
    { key: 'system', label: 'Système' },
    { key: 'personal', label: 'Personnel' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Template de consultation <span className="text-gray-400 font-normal">(optionnel)</span>
        </label>
        <p className="text-xs text-gray-500">
          Sélectionnez un template pour pré-remplir les champs de la consultation
        </p>
      </div>

      {/* Service actif */}
      {activeDeptName && (
        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Service actif : <strong>{activeDeptName}</strong></span>
        </div>
      )}

      {/* Onglets de filtre */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === tab.key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.key === 'department' && activeDeptName
              ? activeDeptName
              : tab.label}
          </button>
        ))}
      </div>

      {/* Liste des templates */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">Aucun template trouvé</p>
          {filter === 'department' && activeDeptName && (
            <p className="text-xs text-gray-400 mt-1">
              Aucun template n'est associé au service <strong>{activeDeptName}</strong>.
              Essayez l'onglet "Tous".
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
          {templates.map((template) => {
            const deptName = template.department?.name ?? getDepartmentName(template.department_id);
            const isSelected = selectedTemplateId === template.id;

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelect(template)}
                className={`text-left p-4 border-2 rounded-lg transition-all hover:border-blue-300 hover:shadow-sm ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Nom + coche */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {template.name}
                      </h4>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {/* Badge service */}
                      {deptName ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          <Building2 className="w-2.5 h-2.5" />
                          {deptName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                          {template.specialty}
                        </span>
                      )}

                      {template.is_system_template && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          <Star className="w-2.5 h-2.5" />
                          Système
                        </span>
                      )}
                      {template.is_shared && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-medium rounded">
                          <Users className="w-2.5 h-2.5" />
                          Partagé
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {template.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                        {template.description}
                      </p>
                    )}

                    {/* Méta */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>Utilisé {template.usage_count} fois</span>
                      {template.suggested_diagnoses?.length > 0 && (
                        <span>{template.suggested_diagnoses.length} diagnostic(s) suggéré(s)</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Confirmation sélection */}
      {selectedTemplateId && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Template sélectionné — les champs seront pré-remplis avec son contenu.
          </p>
        </div>
      )}
    </div>
  );
}
