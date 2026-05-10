import { useState, useEffect } from 'react';
import { AlertTriangle, Eye, Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface StockAlert {
  id: string;
  item_id: string;
  item_name: string;
  alert_type: string;
  current_quantity: number;
  min_quantity: number;
  created_at: string;
}

interface StockAlertsPanelProps {
  onViewItem: (itemId: string) => void;
}

export default function StockAlertsPanel({ onViewItem }: StockAlertsPanelProps) {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      const { data } = await supabase
        .from('inventory_items')
        .select('id, name, quantity, min_quantity')
        .lt('quantity', supabase.rpc ? 10 : 10)
        .order('quantity', { ascending: true })
        .limit(20);

      if (data) {
        setAlerts(data
          .filter((item: any) => item.quantity <= (item.min_quantity || 5))
          .map((item: any) => ({
            id: item.id,
            item_id: item.id,
            item_name: item.name,
            alert_type: item.quantity === 0 ? 'rupture' : 'bas',
            current_quantity: item.quantity,
            min_quantity: item.min_quantity || 5,
            created_at: new Date().toISOString(),
          })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Chargement des alertes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-gray-900">Alertes de stock ({alerts.length})</h3>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p>Aucune alerte active</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border ${
                alert.alert_type === 'rupture'
                  ? 'border-red-200 bg-red-50'
                  : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${
                    alert.alert_type === 'rupture' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{alert.item_name}</p>
                    <p className="text-xs text-gray-600">
                      Stock: {alert.current_quantity} / Min: {alert.min_quantity}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onViewItem(alert.item_id)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
