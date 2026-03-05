import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, PlayCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface QueueItem {
  id: string;
  patient_name: string;
  test_type: string;
  priority: 'normal' | 'urgent';
  arrival_time: string;
  status: 'pending' | 'in_progress';
}

const mockQueueData: QueueItem[] = [
  {
    id: 'q1',
    patient_name: 'Mbala Josephine',
    test_type: 'NFS (Numération Formule Sanguine)',
    priority: 'urgent',
    arrival_time: '08:15',
    status: 'pending'
  },
  {
    id: 'q2',
    patient_name: 'Nkumu Pierre',
    test_type: 'Glycémie à jeun',
    priority: 'normal',
    arrival_time: '08:30',
    status: 'pending'
  },
  {
    id: 'q3',
    patient_name: 'Kalala Marie',
    test_type: 'Test VIH (Dépistage)',
    priority: 'urgent',
    arrival_time: '08:45',
    status: 'pending'
  },
  {
    id: 'q4',
    patient_name: 'Tshilombo Jean',
    test_type: 'Créatinine sérique',
    priority: 'normal',
    arrival_time: '09:00',
    status: 'pending'
  },
  {
    id: 'q5',
    patient_name: 'Mbuyi Grace',
    test_type: 'Bilan hépatique complet',
    priority: 'normal',
    arrival_time: '09:15',
    status: 'in_progress'
  },
  {
    id: 'q6',
    patient_name: 'Kabongo Daniel',
    test_type: 'Électrolytes (Na, K, Cl)',
    priority: 'urgent',
    arrival_time: '09:30',
    status: 'pending'
  },
  {
    id: 'q7',
    patient_name: 'Nsimba Claire',
    test_type: 'CRP (Protéine C-réactive)',
    priority: 'normal',
    arrival_time: '09:45',
    status: 'pending'
  },
  {
    id: 'q8',
    patient_name: 'Lubamba Thomas',
    test_type: 'Paludisme (Test rapide)',
    priority: 'urgent',
    arrival_time: '10:00',
    status: 'pending'
  }
];

export const AnalysisQueue: React.FC = () => {
  const { profile } = useAuth();
  const [queueItems, setQueueItems] = useState<QueueItem[]>(mockQueueData);
  const [loading, setLoading] = useState(false);

  const handleStartAnalysis = async (id: string) => {
    setQueueItems(items =>
      items.map(item =>
        item.id === id ? { ...item, status: 'in_progress' as const } : item
      )
    );

    await supabase.from('notifications').insert({
      user_id: profile?.id,
      type: 'lab_analysis_started',
      title: 'Analyse démarrée',
      message: `L'analyse a été démarrée avec succès`,
      created_at: new Date().toISOString()
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const urgentCount = queueItems.filter(item => item.priority === 'urgent' && item.status === 'pending').length;
  const inProgressCount = queueItems.filter(item => item.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File d'Attente</h1>
          <p className="text-gray-600 mt-2">Analyses en attente de traitement</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-700 font-medium">En attente</p>
              <p className="text-2xl font-bold text-yellow-900">
                {queueItems.filter(item => item.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-red-700 font-medium">Urgent</p>
              <p className="text-2xl font-bold text-red-900">{urgentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <PlayCircle className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-700 font-medium">En cours</p>
              <p className="text-2xl font-bold text-blue-900">{inProgressCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priorité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type d'examen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heure d'arrivée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {queueItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.priority === 'urgent' ? 'URGENT' : 'Normal'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.patient_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{item.test_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {item.arrival_time}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {item.status === 'in_progress' ? 'En cours' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.status === 'pending' ? (
                      <button
                        onClick={() => handleStartAnalysis(item.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Démarrer l'analyse
                      </button>
                    ) : (
                      <span className="text-blue-600 font-medium flex items-center gap-2">
                        <PlayCircle className="w-4 h-4 animate-pulse" />
                        En cours...
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
