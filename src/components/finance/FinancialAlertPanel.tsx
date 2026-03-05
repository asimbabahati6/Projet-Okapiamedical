import { AlertTriangle, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

interface FinancialAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  action?: string;
}

interface FinancialAlertPanelProps {
  cashBalance: number;
  expensesTrend: number;
  profitMargin: number;
}

export function FinancialAlertPanel({ cashBalance, expensesTrend, profitMargin }: FinancialAlertPanelProps) {
  const alerts: FinancialAlert[] = [];

  if (cashBalance < 10000) {
    alerts.push({
      id: 'low-cash',
      type: 'danger',
      title: 'Trésorerie Faible',
      message: `La trésorerie est à $${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}. Envisagez de relancer les paiements en retard.`,
      action: 'Voir les factures impayées',
    });
  }

  if (expensesTrend > 20) {
    alerts.push({
      id: 'high-expenses',
      type: 'warning',
      title: 'Augmentation des Dépenses',
      message: `Les dépenses ont augmenté de ${expensesTrend.toFixed(1)}% par rapport à la période précédente.`,
      action: 'Analyser les dépenses',
    });
  }

  if (profitMargin < 10) {
    alerts.push({
      id: 'low-margin',
      type: 'warning',
      title: 'Marge Bénéficiaire Faible',
      message: `La marge bénéficiaire est de ${profitMargin.toFixed(1)}%. Envisagez d'optimiser les coûts ou d'augmenter les revenus.`,
      action: 'Voir les recommandations',
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'healthy',
      type: 'info',
      title: 'Santé Financière Bonne',
      message: 'Aucune alerte critique détectée. La situation financière est stable.',
    });
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return AlertTriangle;
      case 'warning':
        return TrendingDown;
      default:
        return DollarSign;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Alertes Financières</h3>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = getAlertIcon(alert.type);
          return (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${getIconColor(alert.type)}`} />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                  <p className="text-sm opacity-90">{alert.message}</p>
                  {alert.action && (
                    <button className="mt-2 text-sm font-medium underline hover:no-underline">
                      {alert.action}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
