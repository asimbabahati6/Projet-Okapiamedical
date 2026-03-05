import { useState, useEffect } from 'react';
import { Wrench, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AddMaintenanceRequestModal from '../../components/facilities/AddMaintenanceRequestModal';

interface MaintenanceRequest {
  id: string;
  request_type: string;
  location: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  scheduled_date: string;
}

export default function AdminFacilitiesPage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('facility_maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Installations</h1>
          <p className="text-gray-600">Demandes de maintenance et réparations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle demande
        </button>
      </div>

      <AddMaintenanceRequestModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadRequests}
      />

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
          <p className="text-gray-500">Aucune demande de maintenance en cours</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className={`bg-white rounded-lg shadow p-6 border-l-4 ${getPriorityColor(request.priority)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Wrench className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">{request.location}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    {(request.priority === 'emergency' || request.priority === 'high') && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{request.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Type: {request.request_type}</span>
                    <span>Priorité: {request.priority}</span>
                    <span>Créé: {new Date(request.created_at).toLocaleDateString('fr-FR')}</span>
                    {request.scheduled_date && (
                      <span>Planifié: {new Date(request.scheduled_date).toLocaleDateString('fr-FR')}</span>
                    )}
                  </div>
                </div>
                <button className="ml-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Gérer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
