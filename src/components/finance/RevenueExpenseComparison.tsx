import { useMemo } from 'react';

interface DataPoint {
  date: string;
  amount: number;
}

interface RevenueExpenseComparisonProps {
  revenueData: DataPoint[];
  expenseData: DataPoint[];
  height?: number;
}

export function RevenueExpenseComparison({
  revenueData,
  expenseData,
  height = 300,
}: RevenueExpenseComparisonProps) {
  const { bars, maxValue, dates } = useMemo(() => {
    const dateMap = new Map<string, { revenue: number; expense: number }>();

    revenueData.forEach((point) => {
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, { revenue: 0, expense: 0 });
      }
      dateMap.get(point.date)!.revenue = point.amount;
    });

    expenseData.forEach((point) => {
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, { revenue: 0, expense: 0 });
      }
      dateMap.get(point.date)!.expense = point.amount;
    });

    const sortedDates = Array.from(dateMap.keys()).sort();
    const allValues = sortedDates.flatMap((date) => {
      const data = dateMap.get(date)!;
      return [data.revenue, data.expense];
    });
    const max = Math.max(...allValues, 1);

    const padding = 40;
    const chartWidth = 800 - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = Math.min(30, chartWidth / (sortedDates.length * 2.5));
    const groupWidth = barWidth * 2.5;

    const barData = sortedDates.map((date, index) => {
      const data = dateMap.get(date)!;
      const x = padding + index * groupWidth;

      const revenueHeight = (data.revenue / max) * chartHeight;
      const expenseHeight = (data.expense / max) * chartHeight;

      return {
        date,
        revenue: {
          x,
          y: padding + chartHeight - revenueHeight,
          height: revenueHeight,
          value: data.revenue,
        },
        expense: {
          x: x + barWidth + 5,
          y: padding + chartHeight - expenseHeight,
          height: expenseHeight,
          value: data.expense,
        },
      };
    });

    return { bars: barData, maxValue: max, dates: sortedDates };
  }, [revenueData, expenseData, height]);

  if (!revenueData.length && !expenseData.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenus vs Dépenses</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Revenus vs Dépenses</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Revenus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Dépenses</span>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 800 ${height}`} className="w-full">
        <line x1="40" y1={height - 40} x2="760" y2={height - 40} stroke="#e5e7eb" strokeWidth="2" />

        {bars.map((bar, index) => (
          <g key={index}>
            <rect
              x={bar.revenue.x}
              y={bar.revenue.y}
              width="30"
              height={bar.revenue.height}
              fill="#10b981"
              rx="2"
            >
              <title>Revenus: ${bar.revenue.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</title>
            </rect>

            <rect
              x={bar.expense.x}
              y={bar.expense.y}
              width="30"
              height={bar.expense.height}
              fill="#ef4444"
              rx="2"
            >
              <title>Dépenses: ${bar.expense.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</title>
            </rect>

            <text
              x={bar.revenue.x + 32.5}
              y={height - 20}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {new Date(bar.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </text>
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
