import { useState, useEffect } from 'react';
import { Clock, Users, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { WaitingQueue } from '../../types/database';

interface WaitingQueueDisplayProps {
  onRefresh?: () => void;
}

export function WaitingQueueDisplay({ onRefresh }: WaitingQueueDisplayProps) {
  const [queue, setQueue] = useState<WaitingQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchQueue() {
    try {
      const { data, error } = await supabase
        .from('waiting_queue')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_number),
          physician:user_profiles(full_name)
        `)
        .eq('status', 'waiting')
        .order('priority_level', { ascending: true })
        .order('queue_position', { ascending: true })
        .limit(10);

      if (error) throw error;
      setQueue(data || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchQueue();
    if (onRefresh) {
      onRefresh();
    }
  }

  const getPriorityColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-red-100 text-red-700 border-red-200';
      case 2:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getPriorityLabel = (level: number) => {
    switch (level) {
      case 1:
        return 'Urgence';
      case 2:
        return 'Prioritaire';
      default:
        return 'Normal';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          File d'Attente
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Actualiser"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : queue.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Aucun patient en attente</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {queue.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">
                    {item.patient?.first_name} {item.patient?.last_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {item.queue_number} • N° {item.patient?.patient_number}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(item.priority_level)}`}>
                  {getPriorityLabel(item.priority_level)}
                </span>
              </div>

              {item.physician && (
                <p className="text-xs text-gray-600 mb-1">
                  Médecin: {item.physician.full_name}
                </p>
              )}

              {item.queue_position !== null && (
                <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                  <span className="flex items-center gap-1">
                    Position: <strong>#{item.queue_position}</strong>
                  </span>
                  {item.estimated_wait_minutes > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{item.estimated_wait_minutes} min
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total en attente:</span>
          <span className="font-semibold text-gray-900">{queue.length}</span>
        </div>
      </div>
    </div>
  );
}
