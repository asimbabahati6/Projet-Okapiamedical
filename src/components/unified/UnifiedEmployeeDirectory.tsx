import { useState, useEffect } from 'react';
import { Search, Users, Stethoscope, Briefcase, TrendingUp, Filter, Download, Grid, List, User, Phone, MapPin, Award, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { UnifiedEmployee, UnifiedEmployeeFilters, EmployeeStatistics } from '../../types/unifiedPersonnel';

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="h-12 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  onEmployeeSelect?: (employee: UnifiedEmployee) => void;
}

export function UnifiedEmployeeDirectory({ onEmployeeSelect }: Props) {
  const [employees, setEmployees] = useState<UnifiedEmployee[]>([]);
  const [statistics, setStatistics] = useState<EmployeeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<UnifiedEmployeeFilters>({
    searchTerm: '',
    category: 'all',
    status: 'all',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  async function loadData() {
    try {
      setLoading(true);

      // Load employees
      let query = supabase.from('unified_employee_view').select('*');

      // Apply filters
      if (filters.searchTerm) {
        query = query.or(`full_name.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%,employee_number.ilike.%${filters.searchTerm}%`);
      }

      if (filters.category && filters.category !== 'all') {
        query = query.eq('profile_type', filters.category);
      }

      if (filters.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filters.status === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data: employeeData, error: employeeError } = await query.order('full_name');

      if (employeeError) throw employeeError;

      // Load statistics
      const { data: statsData, error: statsError } = await supabase
        .from('employee_statistics')
        .select('*')
        .single();

      if (statsError) console.error('Error loading statistics:', statsError);

      setEmployees(employeeData || []);
      setStatistics(statsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  function getProfileTypeLabel(type: string): string {
    switch (type) {
      case 'hybrid': return 'Médical & RH';
      case 'medical': return 'Personnel Médical';
      case 'administrative': return 'Personnel Administratif';
      default: return 'Non classifié';
    }
  }

  function getProfileTypeColor(type: string): string {
    switch (type) {
      case 'hybrid': return 'bg-purple-100 text-purple-800';
      case 'medical': return 'bg-blue-100 text-blue-800';
      case 'administrative': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getCompletenessColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Employés</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_employees}</p>
                <p className="text-xs text-gray-500">{statistics.active_employees} actifs</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Stethoscope className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Personnel Médical</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.medical_staff_count}</p>
                <p className="text-xs text-gray-500">Dont {statistics.hybrid_staff_count} hybrides</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Personnel Admin</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.administrative_staff_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Complétude Moyenne</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.avg_profile_completeness}%</p>
                <p className="text-xs text-gray-500">{statistics.incomplete_profiles} incomplets</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              placeholder="Rechercher par nom, téléphone, ou numéro d'employé..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value as any })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Toutes catégories</option>
            <option value="hybrid">Médical & RH</option>
            <option value="medical">Personnel Médical</option>
            <option value="administrative">Personnel Administratif</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Export Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Employee List */}
      {employees.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun employé trouvé</h3>
          <p className="text-gray-600">Essayez de modifier vos filtres de recherche</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => (
            <div
              key={employee.id}
              onClick={() => onEmployeeSelect?.(employee)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{employee.full_name}</h3>
                    <p className="text-sm text-gray-600">{employee.role_name || 'Sans rôle'}</p>
                  </div>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {employee.is_active ? 'Actif' : 'Inactif'}
                </div>
              </div>

              {/* Profile Type Badge */}
              <div className={`text-xs px-3 py-1 rounded-full inline-block mb-3 ${getProfileTypeColor(employee.profile_type)}`}>
                {getProfileTypeLabel(employee.profile_type)}
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                {employee.employee_number && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Award className="w-4 h-4" />
                    <span>{employee.employee_number}</span>
                  </div>
                )}
                {employee.department_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{employee.department_name}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                {employee.hire_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Embauché le {new Date(employee.hire_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>

              {/* Medical Info */}
              {employee.is_medical_staff && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Spécialité: {employee.specialization || 'Non spécifié'}</p>
                  {employee.years_of_experience && (
                    <p className="text-xs text-gray-600">{employee.years_of_experience} ans d'expérience</p>
                  )}
                </div>
              )}

              {/* Completeness Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">Complétude du profil</span>
                  <span className={`font-semibold ${getCompletenessColor(employee.profile_completeness)}`}>
                    {employee.profile_completeness}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      employee.profile_completeness >= 80 ? 'bg-green-500' :
                      employee.profile_completeness >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${employee.profile_completeness}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Département</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complétude</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr
                  key={employee.id}
                  onClick={() => onEmployeeSelect?.(employee)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{employee.full_name}</p>
                        <p className="text-sm text-gray-500">{employee.employee_number || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${getProfileTypeColor(employee.profile_type)}`}>
                      {getProfileTypeLabel(employee.profile_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {employee.department_name || 'Non assigné'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {employee.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {employee.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            employee.profile_completeness >= 80 ? 'bg-green-500' :
                            employee.profile_completeness >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${employee.profile_completeness}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${getCompletenessColor(employee.profile_completeness)}`}>
                        {employee.profile_completeness}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
