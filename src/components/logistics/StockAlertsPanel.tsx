import { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Filter, Eye, Check, X, Package, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LogisticsStockAlert, AlertSeverity, AlertType } from '../../types/logistics';

interface StockAlertsPanelProps {
  onViewItem?: (itemId: string) => void;
}

export default function StockAlertsPanel({ onViewItem }: StockAlertsPanelProps) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<LogisticsStockAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<LogisticsStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    severity: 'all' as AlertSeverity | 'all',
    alert_type: 'all' as AlertType | 'all',
    is_active: true,
    acknowledged: 'all' as 'all' | 'yes' | 'no',
  });

  useEffect(() => {
    fetchAlerts();

    const subscription = supabase
      .channel('logistics_alerts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logistics_stock_alerts' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [alerts, filters]);

  async function fetchAlerts() {
    try {
      const { data, error } = await supabase
        .from('logistics_stock_alerts')
        .select(`
          *,
          item:inventory_items(id, name, sku, current_quantity, min_quantity, max_quantity, unit),
          acknowledger:user_profiles!logistics_stock_alerts_acknowledged_by_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setAlerts(data as any);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...alerts];

    if (filters.severity !== 'all') {
      filtered = filtered.filter(a => a.severity === filters.severity);
    }

    if (filters.alert_type !== 'all') {
      filtered = filtered.filter(a => a.alert_type === filters.alert_type);
    }

    if (filters.is_active) {
      filtered = filtered.filter(a => a.is_active);
    }

    if (filters.acknowledged === 'yes') {
      filtered = filtered.filter(a => a.acknowledged);
    } else if (filters.acknowledged === 'no') {
      filtered = filtered.filter(a => !a.acknowledged);
    }

    setFilteredAlerts(filtered);
  }

  function getSeverityIcon(severity: AlertSeverity) {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'high':
        return <AlertCircle className="w-5 h-5" />;
      case 'medium':
        return <Info className="w-5 h-5" />;
      case 'low':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  }

  function getSeverityColor(severity: AlertSeverity) {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-300';
  }

  function getSeverityLabel(severity: AlertSeverity) {
    const labels = {
      critical: 'Critique',
      high: 'Élevée',
      medium: 'Moyenne',
      low: 'Faible',
    };
    return labels[severity] || severity;
  }

  function getAlertTypeLabel(type: AlertType) {
    const labels: Record<AlertType, string> = {
      low_stock: 'Stock Faible',
      out_of_stock: 'Stock Épuisé',
      critical_stock: 'Stock Critique',
      expiring_soon: 'Expiration Proche',
      expired: 'Expiré',
      overstocked: 'Surstock',
    };
    return labels[type] || type;
  }

  async function handleAcknowledge(alertId: string) {
    try {
      const { error } = await supabase
        .from('logistics_stock_alerts')
        .update({
          acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  async function handleResolve(alertId: string) {
    try {
      const { error } = await supabase
        .from('logistics_stock_alerts')
        .update({
          is_active: false,
          acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  }

  function groupAlertsBySeverity() {
    const grouped = {
      critical: filteredAlerts.filter(a => a.severity === 'critical' && a.is_active && !a.acknowledged),
      high: filteredAlerts.filter(a => a.severity === 'high' && a.is_active && !a.acknowledged),
      medium: filteredAlerts.filter(a => a.severity === 'medium' && a.is_active && !a.acknowledged),
      low: filteredAlerts.filter(a => a.severity === 'low' && a.is_active && !a.acknowledged),
    };
    return grouped;
  }

  const groupedAlerts = groupAlertsBySeverity();
  const activeAlertsCount = alerts.filter(a => a.is_active && !a.acknowledged).length;

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
          <h2 className="text-2xl font-bold text-gray-900">Alertes de Stock</h2>
          <p className="text-gray-600 mt-1">
            {activeAlertsCount} alerte{activeAlertsCount > 1 ? 's' : ''} active{activeAlertsCount > 1 ? 's' : ''} non traitée{activeAlertsCount > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-5 h-5" />
          Filtres
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { severity: 'critical', count: groupedAlerts.critical.length, label: 'Critiques', color: 'bg-red-50 border-red-200' },
          { severity: 'high', count: groupedAlerts.high.length, label: 'Élevées', color: 'bg-orange-50 border-orange-200' },
          { severity: 'medium', count: groupedAlerts.medium.length, label: 'Moyennes', color: 'bg-yellow-50 border-yellow-200' },
          { severity: 'low', count: groupedAlerts.low.length, label: 'Faibles', color: 'bg-blue-50 border-blue-200' },
        ].map((stat) => (
          <div key={stat.severity} className={`${stat.color} border rounded-lg p-4`}>
            <p className="text-sm font-medium text-gray-700">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sévérité</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes</option>
                <option value="critical">Critique</option>
                <option value="high">Élevée</option>
                <option value="medium">Moyenne</option>
                <option value="low">Faible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type d'alerte</label>
              <select
                value={filters.alert_type}
                onChange={(e) => setFilters({ ...filters, alert_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                <option value="out_of_stock">Stock Épuisé</option>
                <option value="critical_stock">Stock Critique</option>
                <option value="low_stock">Stock Faible</option>
                <option value="expiring_soon">Expiration Proche</option>
                <option value="expired">Expiré</option>
                <option value="overstocked">Surstock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={filters.acknowledged}
                onChange={(e) => setFilters({ ...filters, acknowledged: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                <option value="no">Non traité</option>
                <option value="yes">Traité</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ severity: 'all', alert_type: 'all', is_active: true, acknowledged: 'all' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune alerte</h3>
          <p className="text-gray-600">
            {filters.severity !== 'all' || filters.alert_type !== 'all' || filters.acknowledged !== 'all'
              ? 'Aucune alerte ne correspond à vos critères.'
              : 'Tous les articles sont en bon état. Aucune alerte active.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-lg border-2 p-4 transition-all ${
                alert.is_active && !alert.acknowledged
                  ? getSeverityColor(alert.severity)
                  : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    alert.is_active && !alert.acknowledged
                      ? getSeverityColor(alert.severity).split(' ')[0]
                      : 'bg-gray-100'
                  }`}>
                    {getSeverityIcon(alert.severity)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                        {getSeverityLabel(alert.severity)}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {getAlertTypeLabel(alert.alert_type)}
                      </span>
                      {!alert.is_active && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          Résolu
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">{alert.message}</h3>

                    {alert.item && (
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {alert.item.name}
                        </span>
                        <span className="font-mono">{alert.item.sku}</span>
                        {alert.item.current_quantity !== undefined && (
                          <span>
                            Stock: <strong>{alert.item.current_quantity} {alert.item.unit}</strong>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(alert.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {alert.acknowledged && alert.acknowledger && (
                        <span>
                          Traité par {alert.acknowledger.full_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {alert.is_active && !alert.acknowledged && (
                  <div className="flex items-center gap-2">
                    {onViewItem && alert.item_id && (
                      <button
                        onClick={() => onViewItem(alert.item_id!)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir l'article"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Marquer comme lu"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Marquer comme résolu"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
