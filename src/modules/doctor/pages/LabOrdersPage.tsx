import React, { useState, useEffect } from 'react';
import { FlaskConical, Plus, Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { CreateLabOrderModal } from '@/components/laboratory/CreateLabOrderModal';

interface LabOrder {
  id: string;
  order_number: string;
  patient_id: string;
  status: string;
  priority: string;
  created_at: string;
  patients: {
    first_name: string;
    last_name: string;
    patient_number: string;
  };
}

export const LabOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lab_orders')
        .select(`
          *,
          patients(first_name, last_name, patient_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Erreur lors du chargement des analyses', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patients?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patients?.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analyses Laboratoire</h1>
          <p className="text-gray-600 mt-2">Prescrivez et suivez les analyses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle analyse</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FlaskConical className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Terminées</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Annulées</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FlaskConical className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune analyse trouvée</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold">Numéro</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Patient</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Priorité</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{order.order_number}</td>
                  <td className="py-3 px-4">
                    {order.patients?.first_name} {order.patients?.last_name}
                  </td>
                  <td className="py-3 px-4">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.priority === 'urgent' ? 'Urgent' : 'Normal'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'completed' ? 'Terminé' :
                       order.status === 'pending' ? 'En attente' : order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <CreateLabOrderModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
};
