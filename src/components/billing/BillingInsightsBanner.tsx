import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Lightbulb, Calendar } from 'lucide-react';

interface Insight {
  type: 'success' | 'warning' | 'info' | 'danger';
  icon: 'trending-up' | 'trending-down' | 'alert' | 'check' | 'lightbulb' | 'calendar';
  message: string;
}

interface BillingInsightsBannerProps {
  insights: Insight[];
}

export function BillingInsightsBanner({ insights }: BillingInsightsBannerProps) {
  if (insights.length === 0) {
    return null;
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'trending-up':
        return TrendingUp;
      case 'trending-down':
        return TrendingDown;
      case 'alert':
        return AlertCircle;
      case 'check':
        return CheckCircle;
      case 'lightbulb':
        return Lightbulb;
      case 'calendar':
        return Calendar;
      default:
        return AlertCircle;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-blue-600" />
        Insights Rapides
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, index) => {
          const Icon = getIcon(insight.icon);
          const colors = getColors(insight.type);

          return (
            <div
              key={index}
              className={`${colors} border-2 rounded-lg p-4 flex items-start gap-3 transition-all hover:shadow-md`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1">{insight.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
