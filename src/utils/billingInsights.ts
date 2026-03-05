import { BillingStatistics, PeriodComparison, CashFlowDataPoint, ForecastResult } from '../types/billingAnalytics';
import { Invoice } from '../types/database';

export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  icon: string;
  title: string;
  message: string;
  value?: number;
  recommendation?: string;
}

export function generateInsights(
  statistics: BillingStatistics,
  comparison: PeriodComparison,
  forecast: ForecastResult,
  cashFlow: CashFlowDataPoint[],
  invoices: Invoice[]
): Insight[] {
  const insights: Insight[] = [];

  insights.push(...generateTrendInsights(comparison));
  insights.push(...generateRecoveryRateInsights(statistics));
  insights.push(...generateOverdueInsights(statistics, invoices));
  insights.push(...generateForecastInsights(forecast));
  insights.push(...generateCashFlowPatternInsights(cashFlow));
  insights.push(...generatePerformanceInsights(statistics, comparison));

  return insights.sort((a, b) => {
    const priority = { danger: 0, warning: 1, info: 2, success: 3 };
    return priority[a.type] - priority[b.type];
  });
}

function generateTrendInsights(comparison: PeriodComparison): Insight[] {
  const insights: Insight[] = [];
  const { changePercentage } = comparison;

  if (changePercentage.totalCollected > 20) {
    insights.push({
      id: 'trend-excellent',
      type: 'success',
      icon: '📈',
      title: 'Excellente Croissance',
      message: `Les collectes ont augmenté de ${changePercentage.totalCollected.toFixed(1)}% par rapport à la période précédente`,
      value: changePercentage.totalCollected,
      recommendation: 'Continuez ces bonnes pratiques et documentez ce qui fonctionne bien.'
    });
  } else if (changePercentage.totalCollected > 10) {
    insights.push({
      id: 'trend-good',
      type: 'success',
      icon: '📊',
      title: 'Bonne Croissance',
      message: `Les collectes ont progressé de ${changePercentage.totalCollected.toFixed(1)}%`,
      value: changePercentage.totalCollected,
    });
  } else if (changePercentage.totalCollected < -15) {
    insights.push({
      id: 'trend-decline',
      type: 'danger',
      icon: '📉',
      title: 'Baisse Significative',
      message: `Les collectes ont diminué de ${Math.abs(changePercentage.totalCollected).toFixed(1)}%`,
      value: changePercentage.totalCollected,
      recommendation: 'Analysez les causes de cette baisse et mettez en place un plan de relance.'
    });
  } else if (changePercentage.totalCollected < -5) {
    insights.push({
      id: 'trend-warning',
      type: 'warning',
      icon: '⚠️',
      title: 'Légère Baisse',
      message: `Les collectes ont baissé de ${Math.abs(changePercentage.totalCollected).toFixed(1)}%`,
      value: changePercentage.totalCollected,
      recommendation: 'Surveillez cette tendance de près.'
    });
  } else {
    insights.push({
      id: 'trend-stable',
      type: 'info',
      icon: '➡️',
      title: 'Collections Stables',
      message: `Les collectes sont restées stables (${changePercentage.totalCollected > 0 ? '+' : ''}${changePercentage.totalCollected.toFixed(1)}%)`,
      value: changePercentage.totalCollected,
    });
  }

  return insights;
}

function generateRecoveryRateInsights(statistics: BillingStatistics): Insight[] {
  const insights: Insight[] = [];
  const { recoveryRate } = statistics;

  if (recoveryRate >= 95) {
    insights.push({
      id: 'recovery-excellent',
      type: 'success',
      icon: '✅',
      title: 'Taux de Recouvrement Exceptionnel',
      message: `Vous avez un excellent taux de recouvrement de ${recoveryRate.toFixed(1)}%`,
      value: recoveryRate,
    });
  } else if (recoveryRate >= 85) {
    insights.push({
      id: 'recovery-good',
      type: 'success',
      icon: '👍',
      title: 'Bon Taux de Recouvrement',
      message: `Le taux de recouvrement est de ${recoveryRate.toFixed(1)}%`,
      value: recoveryRate,
    });
  } else if (recoveryRate >= 70) {
    insights.push({
      id: 'recovery-moderate',
      type: 'warning',
      icon: '⚡',
      title: 'Taux de Recouvrement Moyen',
      message: `Le taux de recouvrement est de ${recoveryRate.toFixed(1)}%, il y a une marge d'amélioration`,
      value: recoveryRate,
      recommendation: 'Mettez en place des relances systématiques pour améliorer le recouvrement.'
    });
  } else {
    insights.push({
      id: 'recovery-low',
      type: 'danger',
      icon: '🚨',
      title: 'Taux de Recouvrement Faible',
      message: `Le taux de recouvrement est critique à ${recoveryRate.toFixed(1)}%`,
      value: recoveryRate,
      recommendation: 'Action urgente requise : revoyez votre processus de facturation et de relance.'
    });
  }

  return insights;
}

function generateOverdueInsights(statistics: BillingStatistics, invoices: Invoice[]): Insight[] {
  const insights: Insight[] = [];

  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return false;
    const created = new Date(inv.created_at);
    const daysPast = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysPast > 30;
  });

  const criticalOverdue = invoices.filter(inv => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return false;
    const created = new Date(inv.created_at);
    const daysPast = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysPast > 60;
  });

  if (criticalOverdue.length > 0) {
    const amount = criticalOverdue.reduce((sum, inv) => sum + inv.balance, 0);
    insights.push({
      id: 'overdue-critical',
      type: 'danger',
      icon: '🚨',
      title: 'Factures Très En Retard',
      message: `${criticalOverdue.length} facture(s) en retard de plus de 60 jours (${amount.toFixed(2)} USD)`,
      value: criticalOverdue.length,
      recommendation: 'Contactez immédiatement ces patients et envisagez des arrangements de paiement.'
    });
  } else if (overdueInvoices.length > 5) {
    const amount = overdueInvoices.reduce((sum, inv) => sum + inv.balance, 0);
    insights.push({
      id: 'overdue-warning',
      type: 'warning',
      icon: '⚠️',
      title: 'Factures En Retard',
      message: `${overdueInvoices.length} facture(s) en retard de plus de 30 jours (${amount.toFixed(2)} USD)`,
      value: overdueInvoices.length,
      recommendation: 'Intensifiez les relances pour ces factures en retard.'
    });
  } else if (overdueInvoices.length > 0) {
    insights.push({
      id: 'overdue-info',
      type: 'info',
      icon: '📋',
      title: 'Quelques Factures En Retard',
      message: `${overdueInvoices.length} facture(s) en retard de plus de 30 jours`,
      value: overdueInvoices.length,
    });
  }

  return insights;
}

function generateForecastInsights(forecast: ForecastResult): Insight[] {
  const insights: Insight[] = [];

  if (forecast.forecasts.length === 0) return insights;

  const nextWeekRealistic = forecast.forecasts
    .slice(0, 7)
    .reduce((sum, f) => sum + f.realistic, 0);

  const accuracy = forecast.accuracy;

  if (forecast.trend === 'increasing') {
    insights.push({
      id: 'forecast-positive',
      type: 'success',
      icon: '🎯',
      title: 'Projection Positive',
      message: `Projection 7 jours : ${nextWeekRealistic.toFixed(0)} USD (tendance à la hausse)`,
      value: nextWeekRealistic,
      recommendation: accuracy > 70 ? `Prévision fiable à ${accuracy.toFixed(0)}%` : undefined
    });
  } else if (forecast.trend === 'decreasing') {
    insights.push({
      id: 'forecast-negative',
      type: 'warning',
      icon: '📉',
      title: 'Projection En Baisse',
      message: `Projection 7 jours : ${nextWeekRealistic.toFixed(0)} USD (tendance à la baisse)`,
      value: nextWeekRealistic,
      recommendation: 'Préparez-vous à une baisse des revenus et planifiez en conséquence.'
    });
  } else {
    insights.push({
      id: 'forecast-stable',
      type: 'info',
      icon: '📊',
      title: 'Projection Stable',
      message: `Projection 7 jours : ${nextWeekRealistic.toFixed(0)} USD (stable)`,
      value: nextWeekRealistic,
    });
  }

  if (forecast.seasonalPattern) {
    insights.push({
      id: 'seasonal-pattern',
      type: 'info',
      icon: '📅',
      title: 'Pattern Saisonnier Détecté',
      message: 'Des variations récurrentes ont été détectées dans vos collectes',
      recommendation: 'Optimisez votre planning en fonction de ces patterns.'
    });
  }

  return insights;
}

function generateCashFlowPatternInsights(cashFlow: CashFlowDataPoint[]): Insight[] {
  const insights: Insight[] = [];

  if (cashFlow.length < 7) return insights;

  const dayOfWeekMap = new Map<number, number[]>();
  cashFlow.forEach(point => {
    const day = point.date.getDay();
    if (!dayOfWeekMap.has(day)) {
      dayOfWeekMap.set(day, []);
    }
    dayOfWeekMap.get(day)!.push(point.collected);
  });

  const dayAverages = Array.from(dayOfWeekMap.entries()).map(([day, values]) => ({
    day,
    average: values.reduce((sum, v) => sum + v, 0) / values.length,
  }));

  dayAverages.sort((a, b) => b.average - a.average);

  if (dayAverages.length > 0) {
    const bestDay = dayAverages[0];
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    insights.push({
      id: 'best-day',
      type: 'info',
      icon: '💡',
      title: 'Meilleur Jour de Collecte',
      message: `${dayNames[bestDay.day]} génère en moyenne ${bestDay.average.toFixed(0)} USD`,
      value: bestDay.average,
      recommendation: 'Concentrez vos efforts de relance sur ce jour.'
    });
  }

  const recentFlow = cashFlow.slice(-7);
  const negativeFlowDays = recentFlow.filter(d => d.netFlow < 0).length;

  if (negativeFlowDays >= 4) {
    insights.push({
      id: 'negative-flow',
      type: 'danger',
      icon: '🔴',
      title: 'Flux de Trésorerie Négatif',
      message: `${negativeFlowDays} jours sur 7 avec plus d'impayés que de collectes`,
      recommendation: 'Urgence : renforcez les collectes et réduisez les nouveaux crédits.'
    });
  }

  return insights;
}

function generatePerformanceInsights(
  statistics: BillingStatistics,
  comparison: PeriodComparison
): Insight[] {
  const insights: Insight[] = [];

  if (statistics.averagePaymentDelay < 7) {
    insights.push({
      id: 'payment-speed',
      type: 'success',
      icon: '⚡',
      title: 'Paiements Rapides',
      message: `Délai moyen de paiement excellent : ${statistics.averagePaymentDelay.toFixed(1)} jours`,
      value: statistics.averagePaymentDelay,
    });
  } else if (statistics.averagePaymentDelay > 30) {
    insights.push({
      id: 'payment-slow',
      type: 'warning',
      icon: '🐌',
      title: 'Paiements Lents',
      message: `Délai moyen de paiement élevé : ${statistics.averagePaymentDelay.toFixed(1)} jours`,
      value: statistics.averagePaymentDelay,
      recommendation: 'Offrez des incitations pour paiements anticipés ou facilitez les méthodes de paiement.'
    });
  }

  const paidRate = statistics.invoicesCount.total > 0
    ? (statistics.invoicesCount.paid / statistics.invoicesCount.total) * 100
    : 0;

  if (paidRate >= 90) {
    insights.push({
      id: 'completion-high',
      type: 'success',
      icon: '🎯',
      title: 'Excellent Taux de Complétion',
      message: `${paidRate.toFixed(1)}% de vos factures sont entièrement payées`,
      value: paidRate,
    });
  }

  if (comparison.changePercentage.averagePayment > 20) {
    insights.push({
      id: 'ticket-increase',
      type: 'success',
      icon: '💰',
      title: 'Augmentation du Ticket Moyen',
      message: `Le montant moyen par paiement a augmenté de ${comparison.changePercentage.averagePayment.toFixed(1)}%`,
      value: comparison.changePercentage.averagePayment,
    });
  }

  return insights;
}

export function getInsightSummary(insights: Insight[]): {
  critical: number;
  warnings: number;
  positive: number;
  total: number;
} {
  return {
    critical: insights.filter(i => i.type === 'danger').length,
    warnings: insights.filter(i => i.type === 'warning').length,
    positive: insights.filter(i => i.type === 'success').length,
    total: insights.length,
  };
}
