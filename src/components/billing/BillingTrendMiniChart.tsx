interface BillingTrendMiniChartProps {
  data: { date: string; amount: number }[];
  height?: number;
}

export function BillingTrendMiniChart({ data, height = 120 }: BillingTrendMiniChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendance des Paiements (7 derniers jours)</h3>
        <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.amount), 1);
  const width = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xStep = chartWidth / (data.length - 1 || 1);

  const points = data.map((d, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartHeight - (d.amount / maxValue) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  const ySteps = 5;
  const yLines = Array.from({ length: ySteps + 1 }, (_, i) => {
    const value = (maxValue / ySteps) * i;
    const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
    return { y, value };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Tendance des Paiements (7 derniers jours)
      </h3>

      <svg width={width} height={height} className="mx-auto">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {yLines.map((line, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={width - padding.right}
              y2={line.y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={padding.left - 10}
              y={line.y + 4}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {line.value.toFixed(0)}
            </text>
          </g>
        ))}

        <path
          d={areaD}
          fill="url(#areaGradient)"
        />

        <path
          d={pathD}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#10b981"
              stroke="white"
              strokeWidth="2"
              className="hover:r-6 cursor-pointer transition-all"
            >
              <title>{point.date}: {point.amount.toFixed(2)} USD</title>
            </circle>
            <text
              x={point.x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {point.date}
            </text>
          </g>
        ))}

        <text
          x={padding.left - 40}
          y={padding.top + chartHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${padding.left - 40} ${padding.top + chartHeight / 2})`}
          className="text-xs fill-gray-600 font-medium"
        >
          Montant (USD)
        </text>
      </svg>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="text-gray-600">Total 7j</div>
          <div className="text-lg font-bold text-green-600">
            {data.reduce((sum, d) => sum + d.amount, 0).toFixed(2)} USD
          </div>
        </div>
        <div className="border-l border-r border-gray-200">
          <div className="text-gray-600">Moyenne</div>
          <div className="text-lg font-bold text-gray-900">
            {(data.reduce((sum, d) => sum + d.amount, 0) / data.length).toFixed(2)} USD
          </div>
        </div>
        <div>
          <div className="text-gray-600">Meilleur jour</div>
          <div className="text-lg font-bold text-blue-600">
            {Math.max(...data.map(d => d.amount)).toFixed(2)} USD
          </div>
        </div>
      </div>
    </div>
  );
}
