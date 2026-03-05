import { useMemo, memo } from 'react';
import { TrendingUp, TrendingDown, FileText, Users, UserCheck, Calendar } from 'lucide-react';
import { ConsultationStatistics } from '../../../types/consultationHistory';

interface StatisticsCardsProps {
  statistics: ConsultationStatistics;
  previousPeriodStats?: ConsultationStatistics;
}

export const StatisticsCards = memo(function StatisticsCards({ statistics, previousPeriodStats }: StatisticsCardsProps) {
  const calculateTrend = useMemo(() => {
    return (current: number, previous?: number) => {
      if (!previous || previous === 0) return { value: 0, isPositive: true };
      const change = ((current - previous) / previous) * 100;
      return { value: Math.abs(change), isPositive: change >= 0 };
    };
  }, []);

  const { totalTrend, patientsTrend, followUpRate, followUpTrend } = useMemo(() => {
    const totalTrend = calculateTrend(
      statistics.total_consultations,
      previousPeriodStats?.total_consultations
    );

    const patientsTrend = calculateTrend(
      statistics.unique_patients,
      previousPeriodStats?.unique_patients
    );

    const followUpRate = statistics.total_consultations > 0
      ? (statistics.with_follow_up / statistics.total_consultations) * 100
      : 0;

    const previousFollowUpRate = previousPeriodStats && previousPeriodStats.total_consultations > 0
      ? (previousPeriodStats.with_follow_up / previousPeriodStats.total_consultations) * 100
      : undefined;

    const followUpTrend = calculateTrend(followUpRate, previousFollowUpRate);

    return { totalTrend, patientsTrend, followUpRate, followUpTrend };
  }, [statistics, previousPeriodStats, calculateTrend]);

  const cards = useMemo(() => [
    {
      title: 'Total Consultations',
      value: statistics.total_consultations.toLocaleString('fr-FR'),
      icon: FileText,
      color: 'blue',
      trend: previousPeriodStats ? totalTrend : undefined,
    },
    {
      title: 'Patients Uniques',
      value: statistics.unique_patients.toLocaleString('fr-FR'),
      icon: Users,
      color: 'green',
      trend: previousPeriodStats ? patientsTrend : undefined,
    },
    {
      title: 'Avec Suivi',
      value: statistics.with_follow_up.toLocaleString('fr-FR'),
      subtitle: `${followUpRate.toFixed(1)}% des consultations`,
      icon: UserCheck,
      color: 'purple',
      trend: previousPeriodStats ? followUpTrend : undefined,
    },
    {
      title: 'Médecins Actifs',
      value: statistics.unique_doctors.toLocaleString('fr-FR'),
      icon: Calendar,
      color: 'orange',
    },
  ], [statistics, previousPeriodStats, totalTrend, patientsTrend, followUpRate, followUpTrend]);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100' },
      green: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', iconBg: 'bg-orange-100' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const colors = getColorClasses(card.color);
        const Icon = card.icon;

        return (
          <div
            key={index}
            className={`${colors.bg} rounded-xl p-6 transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                <p className={`text-3xl font-bold ${colors.text} mb-1`}>
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500">
                    {card.subtitle}
                  </p>
                )}
                {card.trend && (
                  <div className="flex items-center gap-1 mt-2">
                    {card.trend.isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {card.trend.value.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">vs période précédente</span>
                  </div>
                )}
              </div>
              <div className={`${colors.iconBg} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${colors.text}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
