import { StockAlert } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { X, AlertTriangle, Package, AlertCircle, CheckCircle } from 'lucide-react';

interface StockAlertsPanelProps {
  alerts: StockAlert[];
  onClose: () => void;
  onRefresh: () => void;
}

export default function StockAlertsPanel({ alerts, onClose, onRefresh }: StockAlertsPanelProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  async function acknowledgeAlert(alertId: string) {
    try {
      const { error } = await supabase
        .from('stock_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      showToast('Alerte accusée réception', 'success');
      onRefresh();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      showToast('Erreur lors de l\'accusé de réception', 'error');
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'Stock Faible';
      case 'out_of_stock':
        return 'Stock Épuisé';
      case 'expired':
        return 'Expiré';
      case 'expiring_soon':
        return 'Expire Bientôt';
      default:
        return type;
    }
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const mediumAlerts = alerts.filter(a => a.severity === 'medium');
  const lowAlerts = alerts.filter(a => a.severity === 'low');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">Alertes de Stock</h2>
              <p className="text-orange-100 text-sm mt-1">
                {alerts.length} alerte{alerts.length !== 1 ? 's' : ''} active{alerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune alerte active</h3>
            <p className="text-gray-600 text-center">
              Tous les stocks sont à des niveaux appropriés
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                <p className="text-sm text-red-600 font-medium mb-1">Critiques</p>
                <p className="text-2xl font-bold text-red-900">{criticalAlerts.length}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                <p className="text-sm text-orange-600 font-medium mb-1">Élevées</p>
                <p className="text-2xl font-bold text-orange-900">{highAlerts.length}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                <p className="text-sm text-yellow-600 font-medium mb-1">Moyennes</p>
                <p className="text-2xl font-bold text-yellow-900">{mediumAlerts.length}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-sm text-blue-600 font-medium mb-1">Faibles</p>
                <p className="text-2xl font-bold text-blue-900">{lowAlerts.length}</p>
              </div>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg p-4 border ${getSeverityColor(alert.severity)} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {alert.medication?.brand_name || alert.medication?.generic_name}
                          </h4>
                          <p className="text-sm text-gray-600">{alert.pharmacy?.name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {getAlertTypeLabel(alert.alert_type)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">{alert.message}</p>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {new Date(alert.created_at).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(alert.created_at).toLocaleTimeString('fr-FR')}
                        </div>
                        {!alert.acknowledged && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="text-sm px-3 py-1 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
                          >
                            Accusé de réception
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <Package className="w-4 h-4 inline-block mr-1" />
            Vérifiez régulièrement les stocks pour éviter les ruptures
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
