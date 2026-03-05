import { useMemo } from 'react';

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface ExpenseDistributionChartProps {
  data: ExpenseCategory[];
}

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#6366f1',
  '#f97316',
  '#14b8a6',
  '#a855f7',
];

export function ExpenseDistributionChart({ data }: ExpenseDistributionChartProps) {
  const { segments, total } = useMemo(() => {
    if (!data || data.length === 0) {
      return { segments: [], total: 0 };
    }

    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    let currentAngle = -90;

    const segs = data.map((item, index) => {
      const percentage = (item.amount / totalAmount) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const cx = 150;
      const cy = 150;
      const radius = 100;
      const innerRadius = 60;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);
      const x3 = cx + innerRadius * Math.cos(endRad);
      const y3 = cy + innerRadius * Math.sin(endRad);
      const x4 = cx + innerRadius * Math.cos(startRad);
      const y4 = cy + innerRadius * Math.sin(startRad);

      const largeArc = angle > 180 ? 1 : 0;

      const path = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
        'Z',
      ].join(' ');

      return {
        path,
        color: COLORS[index % COLORS.length],
        category: item.category,
        amount: item.amount,
        percentage: percentage,
      };
    });

    return { segments: segs, total: totalAmount };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Dépenses</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Dépenses</h3>
      <div className="flex items-start gap-6">
        <svg viewBox="0 0 300 300" className="w-64 h-64">
          {segments.map((segment, index) => (
            <g key={index}>
              <path d={segment.path} fill={segment.color} stroke="white" strokeWidth="2">
                <title>
                  {segment.category}: ${segment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({segment.percentage.toFixed(1)}%)
                </title>
              </path>
            </g>
          ))}
          <circle cx="150" cy="150" r="55" fill="white" />
          <text x="150" y="145" textAnchor="middle" fontSize="14" fill="#6b7280" fontWeight="600">
            Total
          </text>
          <text x="150" y="165" textAnchor="middle" fontSize="16" fill="#111827" fontWeight="700">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </text>
        </svg>

        <div className="flex-1 space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm text-gray-700">{segment.category}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  ${segment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-500">{segment.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
