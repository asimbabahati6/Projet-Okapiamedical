import { InvoicesByStatus } from '../../../types/billingAnalytics';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

interface InvoiceStatusChartProps {
  data: InvoicesByStatus[];
}

export function InvoiceStatusChart({ data }: InvoiceStatusChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Répartition des Factures par Statut
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const totalAmount = data.reduce((sum, item) => sum + item.totalAmount, 0);

  const statusConfig: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
    paid: {
      color: 'text-green-700',
      bgColor: 'bg-green-500',
      icon: CheckCircle,
      label: 'Payées'
    },
    pending: {
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-500',
      icon: Clock,
      label: 'En Attente'
    },
    partial: {
      color: 'text-orange-700',
      bgColor: 'bg-orange-500',
      icon: AlertCircle,
      label: 'Partielles'
    },
    cancelled: {
      color: 'text-gray-700',
      bgColor: 'bg-gray-400',
      icon: XCircle,
      label: 'Annulées'
    }
  };

  const sortedData = [...data].sort((a, b) => b.count - a.count);

  const size = 200;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 10;
  const innerRadius = radius * 0.6;

  let currentAngle = -90;
  const paths = sortedData.map(item => {
    const percentage = (item.count / total) * 100;
    const angleSize = (percentage / 100) * 360;
    const endAngle = currentAngle + angleSize;

    const startRad = (currentAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const ix1 = centerX + innerRadius * Math.cos(startRad);
    const iy1 = centerY + innerRadius * Math.sin(startRad);
    const ix2 = centerX + innerRadius * Math.cos(endRad);
    const iy2 = centerY + innerRadius * Math.sin(endRad);

    const largeArc = angleSize > 180 ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z'
    ].join(' ');

    const midAngle = currentAngle + angleSize / 2;
    const labelRadius = radius + 30;
    const labelX = centerX + labelRadius * Math.cos((midAngle * Math.PI) / 180);
    const labelY = centerY + labelRadius * Math.sin((midAngle * Math.PI) / 180);

    currentAngle = endAngle;

    return {
      path,
      percentage,
      item,
      labelX,
      labelY
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Répartition des Factures par Statut
      </h3>

      <div className="flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-shrink-0">
          <svg width={size + 80} height={size + 80} className="mx-auto">
            <g transform={`translate(40, 40)`}>
              {paths.map((pathData, index) => {
                const config = statusConfig[pathData.item.status];
                const colorClass = config.bgColor.replace('bg-', '');
                let fillColor = '#6b7280';

                if (colorClass.includes('green')) fillColor = '#10b981';
                else if (colorClass.includes('yellow')) fillColor = '#f59e0b';
                else if (colorClass.includes('orange')) fillColor = '#f97316';
                else if (colorClass.includes('gray')) fillColor = '#9ca3af';

                return (
                  <g key={index}>
                    <path
                      d={pathData.path}
                      fill={fillColor}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <title>
                        {config.label}: {pathData.item.count} ({pathData.percentage.toFixed(1)}%)
                      </title>
                    </path>
                  </g>
                );
              })}

              <circle
                cx={centerX}
                cy={centerY}
                r={innerRadius}
                fill="white"
              />

              <text
                x={centerX}
                y={centerY - 10}
                textAnchor="middle"
                className="text-2xl font-bold fill-gray-900"
              >
                {total}
              </text>
              <text
                x={centerX}
                y={centerY + 15}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                Factures
              </text>
            </g>
          </svg>
        </div>

        <div className="flex-1 w-full">
          <div className="space-y-4">
            {sortedData.map((item) => {
              const config = statusConfig[item.status];
              const Icon = config.icon;
              const percentage = (item.count / total) * 100;
              const amountPercentage = (item.totalAmount / totalAmount) * 100;

              return (
                <div key={item.status} className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${config.bgColor} bg-opacity-20`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {config.label}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${config.bgColor} transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-600">
                        {item.totalAmount.toFixed(2)} USD
                      </span>
                      <span className="text-xs text-gray-500">
                        {amountPercentage.toFixed(1)}% du total
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-600">Total Factures</div>
                <div className="text-xl font-bold text-gray-900 mt-1">{total}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Montant Total</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {totalAmount.toFixed(0)} USD
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
