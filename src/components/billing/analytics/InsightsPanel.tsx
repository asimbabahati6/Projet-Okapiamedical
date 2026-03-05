import { Insight } from '../../../utils/billingInsights';
import { AlertCircle, CheckCircle, Info, AlertTriangle, ChevronRight, Lightbulb } from 'lucide-react';

interface InsightsPanelProps {
  insights: Insight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Insights et Recommandations
        </h3>
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Aucun insight disponible</p>
          </div>
        </div>
      </div>
    );
  }

  function getInsightIcon(type: Insight['type']) {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'danger':
        return AlertCircle;
      case 'info':
      default:
        return Info;
    }
  }

  function getInsightColor(type: Insight['type']) {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          title: 'text-green-900',
          text: 'text-green-800'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          text: 'text-yellow-800'
        };
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          title: 'text-red-900',
          text: 'text-red-800'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          text: 'text-blue-800'
        };
    }
  }

  const criticalInsights = insights.filter(i => i.type === 'danger');
  const warningInsights = insights.filter(i => i.type === 'warning');
  const positiveInsights = insights.filter(i => i.type === 'success');

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Insights et Recommandations
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Analyse automatique de vos données de facturation
          </p>
        </div>
        <div className="flex items-center gap-4">
          {criticalInsights.length > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{criticalInsights.length} critique{criticalInsights.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {warningInsights.length > 0 && (
            <div className="flex items-center gap-1 text-yellow-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">{warningInsights.length} attention</span>
            </div>
          )}
          {positiveInsights.length > 0 && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{positiveInsights.length} positif{positiveInsights.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => {
          const Icon = getInsightIcon(insight.type);
          const colors = getInsightColor(insight.type);

          return (
            <div
              key={insight.id}
              className={`${colors.bg} ${colors.border} border rounded-lg p-4 transition-all hover:shadow-md`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="text-2xl">{insight.icon}</div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className={`font-semibold ${colors.title}`}>
                      {insight.title}
                    </h4>
                    {insight.value !== undefined && (
                      <span className={`text-sm font-bold ${colors.icon} whitespace-nowrap`}>
                        {typeof insight.value === 'number' && insight.value % 1 !== 0
                          ? insight.value.toFixed(1)
                          : insight.value}
                        {insight.id.includes('rate') || insight.id.includes('percentage') ? '%' : ''}
                      </span>
                    )}
                  </div>

                  <p className={`text-sm ${colors.text} mb-3`}>
                    {insight.message}
                  </p>

                  {insight.recommendation && (
                    <div className={`flex items-start gap-2 mt-3 pt-3 border-t ${colors.border}`}>
                      <Lightbulb className={`w-4 h-4 ${colors.icon} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1">
                        <div className={`text-xs font-medium ${colors.title} mb-1`}>
                          Recommandation
                        </div>
                        <p className={`text-xs ${colors.text}`}>
                          {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {insights.length > 3 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
            Voir tous les insights
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{positiveInsights.length}</div>
            <div className="text-xs text-gray-600 mt-1">Points Positifs</div>
          </div>
          <div className="border-l border-r border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{warningInsights.length}</div>
            <div className="text-xs text-gray-600 mt-1">À Surveiller</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{criticalInsights.length}</div>
            <div className="text-xs text-gray-600 mt-1">Actions Urgentes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
