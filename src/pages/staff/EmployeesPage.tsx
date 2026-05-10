import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Pencil, Files, AlertCircle, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Employee } from '../../types/drcClinic';
import { AddEmployeeWizard } from '../../components/wizard/AddEmployeeWizard';
import { EmployeeDetailsModal } from '../../components/employees/EmployeeDetailsModal';
import { EditEmployeeModal } from '../../components/employees/EditEmployeeModal';
import { DocumentManagementModal } from '../../components/employees/DocumentManagementModal';
import { useAuth } from '../../contexts/AuthContext';
import { ToastContainer } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';

export function EmployeesPage() {
  const { canManageEmployees } = useAuth();
  const { toasts, removeToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [documentEmployee, setDocumentEmployee] = useState<Employee | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployeesList();
  }, [employees, searchTerm, filterStatus]);

  async function loadEmployees() {
    try {
      const { data, error } = await supabase
        .from('unified_employee_view')
        .select('*')
        .order('profile_created_at', { ascending: false });

      if (error) throw error;

      // Map unified_employee_view fields to Employee type
      const mappedEmployees: Employee[] = (data || []).map((record: any) => ({
        id: record.id,
        employee_number: record.employee_number || 'N/A',
        first_name: record.full_name?.split(' ')[0] || '',
        last_name: record.full_name?.split(' ').slice(1).join(' ') || '',
        phone: record.phone || '',
        email: record.professional_email || '',
        photo_url: record.avatar_url,
        department: record.department_name || '',
        position: record.contract_type || 'Employee',
        employment_type: record.contract_type || 'permanent',
        hire_date: record.hire_date || '',
        status: record.employment_status || 'active',
        is_medical_staff: record.is_medical_staff || false,
        medical_specialty: record.specialization || '',
        city: '',
        country: '',
        created_at: record.profile_created_at || '',
        updated_at: record.profile_updated_at || ''
      }));

      setEmployees(mappedEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterEmployeesList() {
    let filtered = employees;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(emp => emp.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.first_name.toLowerCase().includes(term) ||
        emp.last_name.toLowerCase().includes(term) ||
        emp.employee_number.toLowerCase().includes(term) ||
        emp.position.toLowerCase().includes(term)
      );
    }

    setFilteredEmployees(filtered);
  }

  function getStatusBadge(status: string) {
    const styles = {
      active: 'bg-green-100 text-green-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-orange-100 text-orange-800',
      terminated: 'bg-red-100 text-red-800'
    };
    const labels = {
      active: 'Actif',
      on_leave: 'En Congé',
      suspended: 'Suspendu',
      terminated: 'Terminé'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Employés</h1>
          <p className="text-gray-600 mt-1">Gérer les profils du personnel médical et administratif</p>
        </div>
        {canManageEmployees() ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter un Employé
          </button>
        ) : (
          <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
            <Lock className="w-5 h-5" />
            <span className="text-sm">Accès restreint</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Total Employés</p>
          <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Actifs</p>
          <p className="text-2xl font-bold text-green-600">
            {employees.filter(e => e.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">Personnel Médical</p>
          <p className="text-2xl font-bold text-blue-600">
            {employees.filter(e => e.is_medical_staff).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600">En Congé</p>
          <p className="text-2xl font-bold text-yellow-600">
            {employees.filter(e => e.status === 'on_leave').length}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule ou poste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="on_leave">En Congé</option>
              <option value="suspended">Suspendus</option>
              <option value="terminated">Terminés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Matricule</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nom Complet</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Poste</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Département</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Téléphone</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Statut</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Aucun employé trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {employee.employee_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {employee.photo_url ? (
                          <img
                            src={employee.photo_url}
                            alt={`${employee.first_name} ${employee.last_name}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600">
                              {employee.first_name?.[0] || ''}{employee.last_name?.[0] || ''}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </p>
                          {employee.is_medical_staff && (
                            <p className="text-xs text-blue-600">{employee.medical_specialty}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{employee.position}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{employee.department || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{employee.phone}</td>
                    <td className="py-3 px-4">{getStatusBadge(employee.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedEmployee(employee)}
                          className="p-1 hover:bg-blue-50 rounded text-blue-600"
                          title="Voir les détails"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {canManageEmployees() && (
                          <button
                            onClick={() => setEditingEmployee(employee)}
                            className="p-1 hover:bg-green-50 rounded text-green-600"
                            title="Modifier"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDocumentEmployee(employee)}
                          className="p-1 hover:bg-purple-50 rounded text-purple-600"
                          title="Documents"
                        >
                          <Files className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && canManageEmployees() && (
        <AddEmployeeWizard
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadEmployees();
          }}
        />
      )}

      {selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdate={loadEmployees}
        />
      )}

      {editingEmployee && canManageEmployees() && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onUpdate={() => {
            loadEmployees();
            setEditingEmployee(null);
          }}
        />
      )}

      {documentEmployee && (
        <DocumentManagementModal
          employee={documentEmployee}
          onClose={() => setDocumentEmployee(null)}
        />
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
