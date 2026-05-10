import { useState, useEffect } from 'react';
import { FlaskConical, Search, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LabOrder {
  id: string;
  order_number: string;
  patient_name: string;
  test_type: string;
  status: string;
  priority: string;
  created_at: string;
}

export function LaboratoryPage() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const { data } = await supabase
        .from('lab_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setOrders(data.map((o: Record<string, unknown>) => ({
          id: o.id as string,
          order_number: (o.order_number as string) || `LAB-${String(o.id).slice(0, 6)}`,
          patient_name: (o.patient_name as string) || 'Patient',
          test_type: (o.test_type as string) || 'Analyse',
          status: (o.status as string) || 'pending',
          priority: (o.priority as string) || 'normal',
          created_at: o.created_at as string,
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const filtered = orders.filter(o =>
    o.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.order_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FlaskConical className="w-7 h-7 text-teal-600" />
            Laboratoire
          </h1>
          <p className="text-gray-500 mt-1">Gestion des analyses et résultats</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'En attente', count: orders.filter(o => o.status === 'pending').length, color: 'yellow' },
          { label: 'En cours', count: orders.filter(o => o.status === 'in_progress').length, color: 'blue' },
          { label: 'Terminées', count: orders.filter(o => o.status === 'completed').length, color: 'green' },
          { label: 'Urgentes', count: orders.filter(o => o.priority === 'urgent').length, color: 'red' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une analyse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune analyse trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((order) => (
              <div key={order.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                {statusIcon(order.status)}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{order.patient_name}</p>
                  <p className="text-sm text-gray-500">{order.test_type}</p>
                </div>
                <span className="text-xs text-gray-400 font-mono">{order.order_number}</span>
                <span className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
