import { useMemo } from 'react';
import { CashFlowDataPoint } from '../../../types/billingAnalytics';
import { TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

interface CollectionTrendChartProps {
  data: CashFlowDataPoint[];
  height?: number;
}

export function CollectionTrendChart({ data, height = 300 }: CollectionTrendChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    const maxValue = Math.max(
      ...data.map(d => Math.max(d.collected, d.pending))
    );

    const yAxisSteps = 5;
    const stepValue = Math.ceil(maxValue / yAxisSteps / 100) * 100;
    const yMax = stepValue * yAxisSteps;

    return {
      data,
      maxValue,
      yMax,
      stepValue,
      yAxisSteps
    };
  }, [data]);

  if (!chartData || chartData.data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tendance des Collections et Impayés
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Aucune donnée disponible</p>
          </div>
        </div>
      </div>
    );
  }

  const { data: points, yMax, stepValue, yAxisSteps } = chartData;

  const chartWidth = 800;
  const chartHeight = height - 80;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const xStep = plotWidth / (points.length - 1 || 1);

  function getX(index: number): number {
    return paddingLeft + index * xStep;
  }

  function getY(value: number): number {
    const ratio = value / yMax;
    return paddingTop + plotHeight - (ratio * plotHeight);
  }

  function createPath(getValue: (p: CashFlowDataPoint) => number): string {
    return points
      .map((point, index) => {
        const x = getX(index);
        const y = getY(getValue(point));
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }

  const collectedPath = createPath(p => p.collected);
  const pendingPath = createPath(p => p.pending);

  const totalCollected = points.reduce((sum, p) => sum + p.collected, 0);
  const totalPending = points.reduce((sum, p) => sum + p.pending, 0);
  const avgCollected = totalCollected / points.length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Tendance des Collections et Impayés
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Évolution quotidienne sur {points.length} jours
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-xs text-gray-600">Moyenne collectée</div>
            <div className="text-lg font-semibold text-green-600">
              {avgCollected.toFixed(0)} USD
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">Collecté</span>
          <span className="text-sm font-semibold text-green-600">
            {totalCollected.toFixed(0)} USD
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-orange-500 rounded"></div>
          <span className="text-sm text-gray-700">Impayé</span>
          <span className="text-sm font-semibold text-orange-600">
            {totalPending.toFixed(0)} USD
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="mx-auto">
          <g>
            {Array.from({ length: yAxisSteps + 1 }).map((_, i) => {
              const value = i * stepValue;
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

          <g>
            {points.map((point, i) => {
              if (i % Math.ceil(points.length / 10) !== 0) return null;
              const x = getX(i);
              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={chartHeight - paddingBottom}
                    stroke="#f3f4f6"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={chartHeight - paddingBottom + 20}
                    textAnchor="middle"
                    className="text-xs fill-gray-500"
                  >
                    {new Date(point.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit'
                    })}
                  </text>
                </g>
              );
            })}
          </g>

          <path
            d={collectedPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={pendingPath}
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, i) => {
            const x = getX(i);
            const yCollected = getY(point.collected);
            const yPending = getY(point.pending);

            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={yCollected}
                  r="4"
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-6 cursor-pointer transition-all"
                >
                  <title>
                    {new Date(point.date).toLocaleDateString('fr-FR')}: {point.collected.toFixed(2)} USD collecté
                  </title>
                </circle>
                <circle
                  cx={x}
                  cy={yPending}
                  r="4"
                  fill="#f97316"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-6 cursor-pointer transition-all"
                >
                  <title>
                    {new Date(point.date).toLocaleDateString('fr-FR')}: {point.pending.toFixed(2)} USD impayé
                  </title>
                </circle>
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

          <text
            x={paddingLeft + plotWidth / 2}
            y={chartHeight - 5}
            textAnchor="middle"
            className="text-xs fill-gray-600 font-medium"
          >
            Date
          </text>
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Total Collecté</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {totalCollected.toFixed(2)} USD
          </div>
        </div>
        <div className="text-center border-l border-r border-gray-200">
          <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Total Impayé</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {totalPending.toFixed(2)} USD
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Flux Net</span>
          </div>
          <div className={`text-lg font-bold ${totalCollected - totalPending >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(totalCollected - totalPending).toFixed(2)} USD
          </div>
        </div>
      </div>
    </div>
  );
}
