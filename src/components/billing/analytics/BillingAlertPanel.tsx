import { useState } from 'react';
import { AlertTriangle, AlertCircle, AlertOctagon, Info, X, Check, Bell } from 'lucide-react';
import { BillingAlert } from '../../../types/billingAnalytics';
import { getSeverityColor } from '../../../utils/billingAlerts';
import { formatCurrency } from '../../../utils/billingCalculations';

interface BillingAlertPanelProps {
  alerts: BillingAlert[];
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}

export function BillingAlertPanel({ alerts, onAcknowledge, onDismiss }: BillingAlertPanelProps) {
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const toggleAlert = (alertId: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  const getIcon = (severity: BillingAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="w-5 h-5" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5" />;
      case 'low':
        return <Info className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tout va bien!</h3>
        <p className="text-gray-600">Aucune alerte de facturation détectée pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Alertes Actives ({activeAlerts.length})
          </h3>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-2 rounded-lg overflow-hidden ${getSeverityColor(alert.severity)}`}
              >
                <div
                  className="p-4 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => toggleAlert(alert.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getIcon(alert.severity)}
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{alert.title}</h4>
                        <p className="text-sm">{alert.message}</p>

                        {expandedAlerts.has(alert.id) && (
                          <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="opacity-75">Valeur actuelle:</span>
                                <p className="font-medium">
                                  {alert.type === 'recovery_rate'
                                    ? `${alert.value.toFixed(1)}%`
                                    : formatCurrency(alert.value)}
                                </p>
                              </div>
                              <div>
                                <span className="opacity-75">Seuil:</span>
                                <p className="font-medium">
                                  {alert.type === 'recovery_rate'
                                    ? `${alert.threshold}%`
                                    : formatCurrency(alert.threshold)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 text-xs opacity-75">
                              Détectée le {new Date(alert.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {onAcknowledge && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcknowledge(alert.id);
                          }}
                          className="p-2 hover:bg-black hover:bg-opacity-10 rounded-lg transition-colors"
                          title="Accuser réception"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {onDismiss && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(alert.id);
                          }}
                          className="p-2 hover:bg-black hover:bg-opacity-10 rounded-lg transition-colors"
                          title="Ignorer"
                        >
                          <X className="w-4 h-4" />
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

      {acknowledgedAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            Alertes Accusées ({acknowledgedAlerts.length})
          </h3>
          <div className="space-y-2">
            {acknowledgedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 opacity-60"
              >
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    <p className="text-xs text-gray-600">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
