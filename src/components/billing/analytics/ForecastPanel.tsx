import { ForecastResult } from '../../../types/billingAnalytics';
import { TrendingUp, TrendingDown, Minus, Activity, Target } from 'lucide-react';

interface ForecastPanelProps {
  forecast: ForecastResult;
}

export function ForecastPanel({ forecast }: ForecastPanelProps) {
  if (!forecast || forecast.forecasts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Prévisions de Trésorerie
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Données insuffisantes pour générer des prévisions</p>
            <p className="text-sm mt-1">Minimum 3 jours de données requis</p>
          </div>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (forecast.trend) {
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTrendLabel = () => {
    switch (forecast.trend) {
      case 'increasing':
        return 'Croissance';
      case 'decreasing':
        return 'Décroissance';
      default:
        return 'Stable';
    }
  };

  const getTrendColor = () => {
    switch (forecast.trend) {
      case 'increasing':
        return 'text-green-700 bg-green-100';
      case 'decreasing':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-blue-700 bg-blue-100';
    }
  };

  const allData = [...forecast.historicalData, ...forecast.forecasts.map(f => ({
    date: f.date,
    collected: f.realistic,
    pending: 0,
    netFlow: f.realistic
  }))];

  const maxValue = Math.max(
    ...forecast.historicalData.map(d => d.collected),
    ...forecast.forecasts.map(f => Math.max(f.optimistic, f.realistic, f.pessimistic))
  );

  const chartWidth = 800;
  const chartHeight = 300;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 60;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const yMax = Math.ceil(maxValue / 100) * 100;
  const xStep = plotWidth / (allData.length - 1 || 1);

  function getX(index: number): number {
    return paddingLeft + index * xStep;
  }

  function getY(value: number): number {
    const ratio = value / yMax;
    return paddingTop + plotHeight - (ratio * plotHeight);
  }

  function createPath(getValue: (index: number) => number, startIndex: number, endIndex: number): string {
    return Array.from({ length: endIndex - startIndex + 1 })
      .map((_, i) => {
        const index = startIndex + i;
        const x = getX(index);
        const y = getY(getValue(index));
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }

  const historicalPath = createPath(
    i => forecast.historicalData[i].collected,
    0,
    forecast.historicalData.length - 1
  );

  const realisticPath = createPath(
    i => {
      const forecastIndex = i - forecast.historicalData.length;
      return forecast.forecasts[forecastIndex].realistic;
    },
    forecast.historicalData.length - 1,
    allData.length - 1
  );

  const optimisticPath = createPath(
    i => {
      const forecastIndex = i - forecast.historicalData.length;
      return forecast.forecasts[forecastIndex].optimistic;
    },
    forecast.historicalData.length - 1,
    allData.length - 1
  );

  const pessimisticPath = createPath(
    i => {
      const forecastIndex = i - forecast.historicalData.length;
      return forecast.forecasts[forecastIndex].pessimistic;
    },
    forecast.historicalData.length - 1,
    allData.length - 1
  );

  const next7DaysRealistic = forecast.forecasts.slice(0, 7).reduce((sum, f) => sum + f.realistic, 0);
  const next7DaysOptimistic = forecast.forecasts.slice(0, 7).reduce((sum, f) => sum + f.optimistic, 0);
  const next7DaysPessimistic = forecast.forecasts.slice(0, 7).reduce((sum, f) => sum + f.pessimistic, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Prévisions de Trésorerie ({forecast.period})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Projection basée sur {forecast.historicalData.length} jours de données historiques
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${getTrendColor()}`}>
              {getTrendLabel()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Précision: {forecast.accuracy.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-600 rounded"></div>
          <span className="text-gray-700">Historique</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-green-500 rounded"></div>
          <span className="text-gray-700">Optimiste</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-500 rounded"></div>
          <span className="text-gray-700">Réaliste</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-orange-500 rounded"></div>
          <span className="text-gray-700">Pessimiste</span>
        </div>
        {forecast.seasonalPattern && (
          <div className="ml-auto flex items-center gap-2 text-blue-600">
            <Activity className="w-4 h-4" />
            <span className="font-medium">Pattern saisonnier détecté</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="mx-auto">
          <defs>
            <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <g>
            {Array.from({ length: 6 }).map((_, i) => {
              const value = (yMax / 5) * i;
              const y = getY(value);
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-500"
                  >
                    {value}
                  </text>
                </g>
              );
            })}
          </g>

          <line
            x={getX(forecast.historicalData.length - 1)}
            y1={paddingTop}
            y2={chartHeight - paddingBottom}
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          <text
            x={getX(forecast.historicalData.length - 1)}
            y={paddingTop - 5}
            textAnchor="middle"
            className="text-xs fill-gray-600 font-medium"
          >
            Aujourd'hui
          </text>

          <path
            d={historicalPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={optimisticPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />

          <path
            d={realisticPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={pessimisticPath}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />

          {allData.map((_, i) => {
            if (i % Math.ceil(allData.length / 10) !== 0) return null;
            const x = getX(i);
            const date = allData[i].date;
            const isHistorical = i < forecast.historicalData.length;

            return (
              <g key={i}>
                <text
                  x={x}
                  y={chartHeight - paddingBottom + 20}
                  textAnchor="middle"
                  className={`text-xs ${isHistorical ? 'fill-gray-600' : 'fill-blue-600 font-medium'}`}
                >
                  {new Date(date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </text>
              </g>
            );
          })}

          <text
            x={paddingLeft - 50}
            y={paddingTop + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${paddingLeft - 50} ${paddingTop + plotHeight / 2})`}
            className="text-xs fill-gray-600 font-medium"
          >
            Montant (USD)
          </text>
        </svg>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Scénario Optimiste</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-700">
            {next7DaysOptimistic.toFixed(0)} USD
          </div>
          <div className="text-xs text-green-600 mt-1">7 prochains jours</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Scénario Réaliste</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {next7DaysRealistic.toFixed(0)} USD
          </div>
          <div className="text-xs text-blue-600 mt-1">Projection probable</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-900">Scénario Pessimiste</span>
            <TrendingDown className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-700">
            {next7DaysPessimistic.toFixed(0)} USD
          </div>
          <div className="text-xs text-orange-600 mt-1">Scénario prudent</div>
        </div>
      </div>
    </div>
  );
}
