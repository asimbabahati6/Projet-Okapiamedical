import { useState, useEffect } from 'react';
import { X, Calendar, User, Stethoscope, Filter } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ConsultationFilters } from '../../../types/consultationHistory';
import { MedicalStaff, Department, UserProfile } from '../../../types/database';
import { formatDoctorName } from '../../../utils/formatDoctorName';

interface ConsultationFiltersPanelProps {
  filters: ConsultationFilters;
  onFiltersChange: (filters: Partial<ConsultationFilters>) => void;
  onClear: () => void;
  onClose: () => void;
}

export function ConsultationFiltersPanel({
  filters,
  onFiltersChange,
  onClear,
  onClose
}: ConsultationFiltersPanelProps) {
  const [doctors, setDoctors] = useState<(MedicalStaff & { user_profile?: UserProfile })[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  async function fetchFilterOptions() {
    try {
      setLoading(true);

      const [doctorsRes, departmentsRes] = await Promise.all([
        supabase
          .from('medical_staff')
          .select(`
            *,
            user_profile:user_profiles(
              id,
              full_name,
              department_id
            )
          `)
          .order('user_profile(full_name)'),
        supabase
          .from('departments')
          .select('*')
          .eq('is_active', true)
          .order('name')
      ]);

      if (doctorsRes.data) setDoctors(doctorsRes.data);
      if (departmentsRes.data) setDepartments(departmentsRes.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setLoading(false);
    }
  }

  const datePresets = [
    { label: 'Aujourd\'hui', getValue: () => ({ start: new Date(), end: new Date() }) },
    {
      label: '7 derniers jours',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return { start, end };
      }
    },
    {
      label: '30 derniers jours',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { start, end };
      }
    },
    {
      label: 'Ce mois',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start, end };
      }
    },
    {
      label: '3 derniers mois',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 3);
        return { start, end };
      }
    },
    {
      label: 'Cette année',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return { start, end };
      }
    },
  ];

  const handleDatePreset = (preset: { start: Date; end: Date }) => {
    onFiltersChange({
      startDate: preset.start,
      endDate: preset.end
    });
  };

  const hasActiveFilters = !!(
    filters.startDate ||
    filters.endDate ||
    filters.doctorId ||
    filters.departmentId ||
    filters.diagnosisSearch ||
    filters.statusFilter
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Actifs
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Réinitialiser
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <Calendar className="w-4 h-4" />
            Période
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {datePresets.map((preset, index) => (
              <button
                key={index}
                onClick={() => handleDatePreset(preset.getValue())}
                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date début</label>
              <input
                type="date"
                value={filters.startDate?.toISOString().split('T')[0] || ''}
                onChange={(e) =>
                  onFiltersChange({ startDate: e.target.value ? new Date(e.target.value) : undefined })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Date fin</label>
              <input
                type="date"
                value={filters.endDate?.toISOString().split('T')[0] || ''}
                onChange={(e) =>
                  onFiltersChange({ endDate: e.target.value ? new Date(e.target.value) : undefined })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Stethoscope className="w-4 h-4" />
            Médecin
          </label>
          <select
            value={filters.doctorId || ''}
            onChange={(e) => onFiltersChange({ doctorId: e.target.value || undefined })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Tous les médecins</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {formatDoctorName(doctor.user_profile?.full_name)}
                {doctor.specialization && ` - ${doctor.specialization}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4" />
            Département
          </label>
          <select
            value={filters.departmentId || ''}
            onChange={(e) => onFiltersChange({ departmentId: e.target.value || undefined })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Tous les départements</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recherche Diagnostic
          </label>
          <input
            type="text"
            value={filters.diagnosisSearch || ''}
            onChange={(e) => onFiltersChange({ diagnosisSearch: e.target.value || undefined })}
            placeholder="Rechercher un diagnostic..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut de Suivi
          </label>
          <select
            value={filters.statusFilter || 'all'}
            onChange={(e) => onFiltersChange({ statusFilter: e.target.value as any })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous</option>
            <option value="with_follow_up">Avec suivi prévu</option>
            <option value="follow_up_pending">Suivi en attente</option>
            <option value="follow_up_overdue">Suivi en retard</option>
          </select>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Appliquer les filtres
          </button>
        </div>
      </div>
    </div>
  );
}
