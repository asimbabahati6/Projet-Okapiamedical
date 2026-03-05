import { useMemo } from 'react';

interface DataPoint {
  date: string;
  amount: number;
}

interface RevenueTrendChartProps {
  data: DataPoint[];
  height?: number;
}

export function RevenueTrendChart({ data, height = 300 }: RevenueTrendChartProps) {
  const { path, maxValue, formattedData } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: '', maxValue: 0, formattedData: [] };
    }

    const max = Math.max(...data.map((d) => d.amount));
    const padding = 40;
    const width = 800;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;

    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
      const y = padding + chartHeight - (point.amount / (max || 1)) * chartHeight;
      return { x, y, ...point };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return { path: pathData, maxValue: max, formattedData: points };
  }, [data, height]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendance des Revenus</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendance des Revenus</h3>
      <svg viewBox={`0 0 800 ${height}`} className="w-full">
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {formattedData.map((point, index) => (
          <g key={index}>
            <line
              x1={point.x}
              y1={40}
              x2={point.x}
              y2={height - 40}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4"
            />
            <text
              x={point.x}
              y={height - 20}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {new Date(point.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </text>
          </g>
        ))}

        <path
          d={`${path} L ${formattedData[formattedData.length - 1]?.x || 0} ${height - 40} L 40 ${height - 40} Z`}
          fill="url(#revenueGradient)"
        />

        <path
          d={path}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {formattedData.map((point, index) => (
          <g key={`point-${index}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="white" stroke="#3b82f6" strokeWidth="2" />
            <title>${point.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</title>
          </g>
        ))}

        <text x="20" y="25" fontSize="12" fill="#6b7280" fontWeight="600">
          ${maxValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
        </text>
        <text x="20" y={height - 45} fontSize="12" fill="#6b7280" fontWeight="600">
          $0
        </text>
      </svg>
    </div>
  );
}
