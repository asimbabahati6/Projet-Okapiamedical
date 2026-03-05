import { useState, useEffect, useMemo } from 'react';
import { TestTube, Plus, Download, Search, Filter, Clock, CheckCircle, AlertTriangle, FlaskConical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AddLabOrderModal } from '../../components/laboratory/AddLabOrderModal';
import { useRolePermissions } from '../../hooks/useRolePermissions';
import { ReadOnlyBadge } from '../../components/common/ReadOnlyBadge';
import { ButtonWithPermission } from '../../components/common/ButtonWithPermission';
import { LabOrderActions } from '../../components/laboratory/LabOrderActions';
import { PermissionGuard } from '../../components/common/PermissionGuard';

interface LabOrder {
  id: string;
  order_number: string;
  patient_id: string;
  doctor_id: string;
  test_type: string;
  status: string;
  priority: string;
  sample_collected_at: string | null;
  results_ready_at: string | null;
  notes: string;
  created_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    patient_number: string;
  };
  doctor?: {
    full_name: string;
  };
}

export function LaboratoryPage() {
  const permissions = useRolePermissions('laboratory');
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchLabOrders();
  }, []);

  async function fetchLabOrders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lab_orders')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_number),
          doctor:user_profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLabOrders(data || []);
    } catch (error) {
      console.error('Error fetching lab orders:', error);
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    const headers = ['Numéro', 'Patient', 'Médecin', 'Type de test', 'Statut', 'Priorité', 'Date'];
    const rows = filteredOrders.map(order => [
      order.order_number,
      order.patient ? `${order.patient.first_name} ${order.patient.last_name}` : '',
      order.doctor?.full_name || '',
      order.test_type,
      order.status,
      order.priority || 'normal',
      new Date(order.created_at).toLocaleDateString('fr-FR')
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyses-laboratoire-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const filteredOrders = labOrders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.test_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.patient &&
                          `${order.patient.first_name} ${order.patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'available_for_interpretation': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      in_progress: 'En cours',
      available_for_interpretation: 'Disponible chez le médecin pour interprétation',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };
    return labels[status] || status;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return styles[priority as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const stats = useMemo(() => {
    const pending = labOrders.filter(o => o.status === 'pending').length;
    const inProgress = labOrders.filter(o => o.status === 'in_progress').length;
    const completed = labOrders.filter(o => o.status === 'completed').length;
    const urgent = labOrders.filter(o => o.priority === 'urgent').length;
    return { pending, inProgress, completed, urgent };
  }, [labOrders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleViewOrder = (order: LabOrder) => {
    console.log('View order:', order);
  };

  const handleEditOrder = (order: LabOrder) => {
    console.log('Edit order:', order);
  };

  const handleDeleteOrder = (order: LabOrder) => {
    console.log('Delete order:', order);
  };

  return (
    <PermissionGuard
      hasPermission={permissions.canViewDetails || permissions.canCreate}
      fallbackMessage="Le module Laboratoire nécessite des permissions spécifiques. Contactez votre administrateur système."
      redirectTo="/staff/dashboard"
    >
      <div>
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laboratoire</h1>
          <p className="text-gray-600">Gérer les analyses et tests de laboratoire</p>
        </div>
        <div className="flex gap-3">
          <ButtonWithPermission
            hasPermission={permissions.canExport}
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            tooltip="L'export est réservé au personnel autorisé"
            hideWhenNoPermission={false}
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </ButtonWithPermission>
          <ButtonWithPermission
            hasPermission={permissions.canCreate}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            tooltip="Seul le personnel de laboratoire peut créer des analyses"
            hideWhenNoPermission={false}
          >
            <Plus className="w-4 h-4" />
            Nouvelle Analyse
          </ButtonWithPermission>
        </div>
      </div>

      {permissions.isReadOnly && permissions.role === 'doctor' && (
        <div className="mb-6">
          <ReadOnlyBadge message="Mode Consultation - Vous pouvez prescrire de nouvelles analyses mais pas modifier les résultats existants" />
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Analyses en Attente */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Analyses en Attente</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* En Cours d'Analyse */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">En Cours d'Analyse</p>
              <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Analyses Terminées */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Analyses Terminées</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Cas Urgents */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Cas Urgents</p>
              <p className="text-3xl font-bold text-gray-900">{stats.urgent}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par numéro, patient, type de test..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="in_progress">En cours</option>
              <option value="available_for_interpretation">Disponible chez le médecin</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filtrer
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numéro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médecin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type de test</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <TestTube className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Aucune analyse trouvée</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.patient ? (
                        <div>
                          <div className="font-medium">
                            {order.patient.first_name} {order.patient.last_name}
                          </div>
                          <div className="text-gray-500">{order.patient.patient_number}</div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.doctor?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.test_type}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(order.priority || 'normal')}`}>
                        {order.priority || 'normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <LabOrderActions
                        order={order}
                        permissions={permissions}
                        onView={handleViewOrder}
                        onEdit={handleEditOrder}
                        onDelete={handleDeleteOrder}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddLabOrderModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchLabOrders}
        />
      )}
      </div>
    </PermissionGuard>
  );
}
