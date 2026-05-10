import { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, Mail, Phone, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdministrativeStaff {
  id: string;
  employee_id: string;
  division: string;
  position_level: string;
  specific_role: string;
  department_head: boolean;
  access_level: string;
  can_manage_staff: boolean;
  can_approve_budgets: boolean;
  can_generate_reports: boolean;
  employee: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

export default function AdministrativeStaffPage() {
  const [staff, setStaff] = useState<AdministrativeStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('administrative_staff')
        .select(`
          *,
          employee:employees(first_name, last_name, email, phone)
        `)
        .order('division', { ascending: true })
        .order('position_level', { ascending: true });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      (member.employee?.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (member.employee?.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (member.specific_role?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesDivision = selectedDivision === 'all' || member.division === selectedDivision;
    const matchesPosition = selectedPosition === 'all' || member.position_level === selectedPosition;

    return matchesSearch && matchesDivision && matchesPosition;
  });

  const getDivisionLabel = (division: string) => {
    const labels: Record<string, string> = {
      hr: 'Ressources Humaines',
      finance: 'Finance',
      operations: 'Opérations',
      information_systems: 'Systèmes d\'Information'
    };
    return labels[division] || division;
  };

  const getDivisionColor = (division: string) => {
    const colors: Record<string, string> = {
      hr: 'bg-blue-100 text-blue-800',
      finance: 'bg-green-100 text-green-800',
      operations: 'bg-orange-100 text-orange-800',
      information_systems: 'bg-purple-100 text-purple-800'
    };
    return colors[division] || 'bg-gray-100 text-gray-800';
  };

  const getPositionLabel = (level: string) => {
    const labels: Record<string, string> = {
      director: 'Directeur',
      manager: 'Gestionnaire',
      officer: 'Officier',
      specialist: 'Spécialiste',
      assistant: 'Assistant',
      support: 'Support'
    };
    return labels[level] || level;
  };

  const getAccessLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      full: 'bg-green-100 text-green-800',
      division_only: 'bg-yellow-100 text-yellow-800',
      limited: 'bg-gray-100 text-gray-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personnel Administratif</h1>
          <p className="text-gray-600">Gestion du personnel du département d'administration</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          Ajouter un membre
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="all">Toutes les divisions</option>
            <option value="hr">Ressources Humaines</option>
            <option value="finance">Finance</option>
            <option value="operations">Opérations</option>
            <option value="information_systems">Systèmes d'Information</option>
          </select>

          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="all">Tous les niveaux</option>
            <option value="director">Directeur</option>
            <option value="manager">Gestionnaire</option>
            <option value="officer">Officier</option>
            <option value="specialist">Spécialiste</option>
            <option value="assistant">Assistant</option>
            <option value="support">Support</option>
          </select>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              {filteredStaff.length} résultat(s)
            </span>
          </div>
        </div>
      </div>

      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun personnel trouvé</h3>
          <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStaff.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center">
                      <Users className="h-8 w-8 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {member.employee?.first_name} {member.employee?.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{member.specific_role}</p>
                      {member.department_head && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                          Chef de département
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Division:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDivisionColor(member.division)}`}>
                      {getDivisionLabel(member.division)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Niveau:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {getPositionLabel(member.position_level)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Accès:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccessLevelColor(member.access_level)}`}>
                      {member.access_level}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    {member.employee?.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {member.employee.email}
                      </div>
                    )}
                    {member.employee?.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {member.employee?.phone}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${member.can_manage_staff ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        Gestion du personnel
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${member.can_approve_budgets ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        Approbation budgets
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${member.can_generate_reports ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        Génération rapports
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm">
                    Voir détails
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Modifier
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
