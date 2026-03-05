import {
  FinancialRatios,
  TrendAnalysis,
  FinancialAlert,
  FinancialRecommendation,
  FinancialHealthScore,
  IncomeStatement,
  CashFlowStatement
} from '../types/financialReport';
import { Invoice } from '../types/database';

export function analyzeTrends(
  currentIncome: IncomeStatement,
  previousIncome: IncomeStatement,
  invoicesByMonth: { [key: string]: number }
): TrendAnalysis {
  const revenueGrowth = previousIncome.revenue.total > 0
    ? ((currentIncome.revenue.total - previousIncome.revenue.total) / previousIncome.revenue.total) * 100
    : 0;

  const expenseGrowth = previousIncome.operatingExpenses.total > 0
    ? ((currentIncome.operatingExpenses.total - previousIncome.operatingExpenses.total) /
      previousIncome.operatingExpenses.total) * 100
    : 0;

  const profitabilityChange = previousIncome.netMargin > 0
    ? ((currentIncome.netMargin - previousIncome.netMargin) / previousIncome.netMargin) * 100
    : 0;

  const monthlyRevenues = Object.values(invoicesByMonth);
  const revenueVolatility = calculateVolatility(monthlyRevenues);

  return {
    revenue: {
      trend: revenueGrowth > 5 ? 'increasing' : revenueGrowth < -5 ? 'decreasing' : 'stable',
      growthRate: revenueGrowth,
      volatility: revenueVolatility,
      seasonality: detectSeasonality(monthlyRevenues)
    },
    expenses: {
      trend: expenseGrowth > 5 ? 'increasing' : expenseGrowth < -5 ? 'decreasing' : 'stable',
      growthRate: expenseGrowth,
      volatility: 0
    },
    profitability: {
      trend: profitabilityChange > 5 ? 'improving' : profitabilityChange < -5 ? 'declining' : 'stable',
      changeRate: profitabilityChange
    },
    cashFlow: {
      trend: currentIncome.netIncome > 0 ? 'positive' : currentIncome.netIncome < 0 ? 'negative' : 'stable',
      averageMonthly: currentIncome.netIncome / 12
    }
  };
}

function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return mean > 0 ? (stdDev / mean) * 100 : 0;
}

function detectSeasonality(values: number[]): boolean {
  if (values.length < 6) return false;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  let aboveCount = 0;
  let belowCount = 0;

  values.forEach(val => {
    if (val > mean * 1.2) aboveCount++;
    if (val < mean * 0.8) belowCount++;
  });

  return (aboveCount >= 2 || belowCount >= 2);
}

export function generateFinancialAlerts(
  ratios: FinancialRatios,
  trendAnalysis: TrendAnalysis,
  cashFlow: CashFlowStatement
): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];

  if (ratios.liquidity.currentRatio < 1.5) {
    alerts.push({
      id: 'liquidity-low',
      type: 'liquidity',
      severity: ratios.liquidity.currentRatio < 1 ? 'critical' : 'high',
      title: 'Ratio de liquidité faible',
      description: `Le ratio de liquidité actuel est de ${ratios.liquidity.currentRatio.toFixed(2)}, inférieur au seuil recommandé de 1.5`,
      value: ratios.liquidity.currentRatio,
      threshold: 1.5,
      recommendation: 'Améliorer le recouvrement des créances et optimiser la gestion de trésorerie'
    });
  }

  if (ratios.profitability.netMargin < 10) {
    alerts.push({
      id: 'profitability-low',
      type: 'profitability',
      severity: ratios.profitability.netMargin < 5 ? 'high' : 'medium',
      title: 'Marge nette faible',
      description: `La marge nette est de ${ratios.profitability.netMargin.toFixed(2)}%, inférieure à l'objectif de 10%`,
      value: ratios.profitability.netMargin,
      threshold: 10,
      recommendation: 'Réviser la structure des coûts et envisager une révision des tarifs'
    });
  }

  if (ratios.efficiency.daysRevenueOutstanding > 60) {
    alerts.push({
      id: 'dso-high',
      type: 'efficiency',
      severity: ratios.efficiency.daysRevenueOutstanding > 90 ? 'high' : 'medium',
      title: 'Délai de recouvrement élevé',
      description: `Le délai moyen de recouvrement est de ${Math.round(ratios.efficiency.daysRevenueOutstanding)} jours`,
      value: ratios.efficiency.daysRevenueOutstanding,
      threshold: 60,
      recommendation: 'Mettre en place une politique de relance plus stricte et offrir des incitations au paiement rapide'
    });
  }

  if (ratios.leverage.debtToEquity > 100) {
    alerts.push({
      id: 'leverage-high',
      type: 'leverage',
      severity: ratios.leverage.debtToEquity > 200 ? 'critical' : 'high',
      title: 'Endettement élevé',
      description: `Le ratio d'endettement est de ${ratios.leverage.debtToEquity.toFixed(2)}%`,
      value: ratios.leverage.debtToEquity,
      threshold: 100,
      recommendation: 'Réduire la dette ou augmenter les capitaux propres pour améliorer la structure financière'
    });
  }

  if (trendAnalysis.revenue.trend === 'decreasing') {
    alerts.push({
      id: 'revenue-declining',
      type: 'trend',
      severity: Math.abs(trendAnalysis.revenue.growthRate) > 15 ? 'high' : 'medium',
      title: 'Baisse du chiffre d\'affaires',
      description: `Les revenus sont en baisse de ${Math.abs(trendAnalysis.revenue.growthRate).toFixed(2)}%`,
      value: trendAnalysis.revenue.growthRate,
      threshold: 0,
      recommendation: 'Analyser les causes de la baisse et mettre en place des actions correctives'
    });
  }

  if (cashFlow.netCashFlow < 0) {
    alerts.push({
      id: 'cashflow-negative',
      type: 'liquidity',
      severity: 'critical',
      title: 'Flux de trésorerie négatif',
      description: `Le flux de trésorerie net est négatif de ${Math.abs(cashFlow.netCashFlow).toFixed(0)} €`,
      value: cashFlow.netCashFlow,
      threshold: 0,
      recommendation: 'Accélérer le recouvrement des créances et réduire les dépenses non essentielles'
    });
  }

  return alerts;
}

export function generateRecommendations(
  ratios: FinancialRatios,
  trendAnalysis: TrendAnalysis,
  alerts: FinancialAlert[]
): FinancialRecommendation[] {
  const recommendations: FinancialRecommendation[] = [];

  if (trendAnalysis.revenue.trend === 'increasing' && ratios.profitability.netMargin > 15) {
    recommendations.push({
      id: 'invest-growth',
      category: 'investment',
      priority: 'high',
      title: 'Investir dans la croissance',
      description: 'La performance financière est excellente. C\'est le moment opportun pour investir dans l\'expansion.',
      expectedImpact: 'Augmentation du chiffre d\'affaires de 20-30% sur 12 mois',
      implementation: 'Recruter du personnel qualifié, acquérir de nouveaux équipements, développer de nouveaux services',
      timeframe: '6-12 mois'
    });
  }

  if (ratios.efficiency.daysRevenueOutstanding > 60) {
    recommendations.push({
      id: 'improve-collection',
      category: 'cash_flow',
      priority: ratios.efficiency.daysRevenueOutstanding > 90 ? 'urgent' : 'high',
      title: 'Améliorer le recouvrement des créances',
      description: 'Le délai de paiement moyen est trop élevé, impactant la trésorerie.',
      expectedImpact: 'Réduction du DSO de 30-40%, amélioration de la trésorerie de 15-20%',
      implementation: 'Mettre en place des relances automatiques, offrir une remise pour paiement comptant, exiger des acomptes',
      timeframe: '3-6 mois'
    });
  }

  if (ratios.profitability.netMargin < 10) {
    recommendations.push({
      id: 'optimize-costs',
      category: 'cost_reduction',
      priority: 'high',
      title: 'Optimiser la structure des coûts',
      description: 'La marge nette est inférieure aux standards du secteur.',
      expectedImpact: 'Augmentation de la marge nette de 5-7 points',
      implementation: 'Négocier avec les fournisseurs, automatiser les processus administratifs, optimiser les plannings',
      timeframe: '6-9 mois'
    });
  }

  if (trendAnalysis.expenses.growthRate > trendAnalysis.revenue.growthRate) {
    recommendations.push({
      id: 'control-expenses',
      category: 'cost_reduction',
      priority: 'urgent',
      title: 'Maîtriser la croissance des dépenses',
      description: 'Les dépenses augmentent plus rapidement que les revenus.',
      expectedImpact: 'Stabilisation des dépenses, amélioration de la rentabilité',
      implementation: 'Réviser tous les contrats de service, éliminer les dépenses non essentielles, renégocier les conditions',
      timeframe: 'Immédiat'
    });
  }

  if (ratios.profitability.revenuePerPatient < 100) {
    recommendations.push({
      id: 'increase-pricing',
      category: 'revenue',
      priority: 'medium',
      title: 'Réviser la stratégie tarifaire',
      description: 'Le revenu moyen par patient est inférieur au potentiel du marché.',
      expectedImpact: 'Augmentation du revenu moyen de 15-25%',
      implementation: 'Analyser les tarifs de la concurrence, développer des packages premium, valoriser l\'expertise',
      timeframe: '3-6 mois'
    });
  }

  if (alerts.some(alert => alert.type === 'liquidity' && alert.severity === 'critical')) {
    recommendations.push({
      id: 'emergency-liquidity',
      category: 'risk_management',
      priority: 'urgent',
      title: 'Action urgente sur la liquidité',
      description: 'La situation de liquidité nécessite une intervention immédiate.',
      expectedImpact: 'Éviter une crise de trésorerie',
      implementation: 'Négocier une ligne de crédit, facturer immédiatement tous les services, reporter les investissements',
      timeframe: 'Immédiat'
    });
  }

  if (trendAnalysis.revenue.seasonality) {
    recommendations.push({
      id: 'manage-seasonality',
      category: 'revenue',
      priority: 'medium',
      title: 'Gérer la saisonnalité',
      description: 'Des variations saisonnières sont détectées dans les revenus.',
      expectedImpact: 'Stabilisation des revenus sur l\'année',
      implementation: 'Développer des promotions en période creuse, diversifier les services, constituer des réserves',
      timeframe: '6-12 mois'
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

export function calculateFinancialHealthScore(
  ratios: FinancialRatios,
  trendAnalysis: TrendAnalysis,
  alerts: FinancialAlert[]
): FinancialHealthScore {
  let liquidityScore = 100;
  if (ratios.liquidity.currentRatio < 1) liquidityScore = 30;
  else if (ratios.liquidity.currentRatio < 1.5) liquidityScore = 60;
  else if (ratios.liquidity.currentRatio < 2) liquidityScore = 80;

  let profitabilityScore = 100;
  if (ratios.profitability.netMargin < 0) profitabilityScore = 20;
  else if (ratios.profitability.netMargin < 5) profitabilityScore = 50;
  else if (ratios.profitability.netMargin < 10) profitabilityScore = 70;
  else if (ratios.profitability.netMargin < 15) profitabilityScore = 85;

  let efficiencyScore = 100;
  if (ratios.efficiency.daysRevenueOutstanding > 120) efficiencyScore = 40;
  else if (ratios.efficiency.daysRevenueOutstanding > 90) efficiencyScore = 60;
  else if (ratios.efficiency.daysRevenueOutstanding > 60) efficiencyScore = 75;
  else if (ratios.efficiency.daysRevenueOutstanding > 30) efficiencyScore = 90;

  let leverageScore = 100;
  if (ratios.leverage.debtToEquity > 300) leverageScore = 30;
  else if (ratios.leverage.debtToEquity > 200) leverageScore = 50;
  else if (ratios.leverage.debtToEquity > 100) leverageScore = 70;
  else if (ratios.leverage.debtToEquity > 50) leverageScore = 85;

  let trendScore = 100;
  if (trendAnalysis.revenue.trend === 'decreasing') trendScore -= 30;
  if (trendAnalysis.profitability.trend === 'declining') trendScore -= 20;
  if (trendAnalysis.cashFlow.trend === 'negative') trendScore -= 30;
  trendScore = Math.max(0, trendScore);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const highAlerts = alerts.filter(a => a.severity === 'high').length;
  const alertPenalty = (criticalAlerts * 10) + (highAlerts * 5);

  const overall = Math.max(0, Math.round(
    (liquidityScore * 0.25 +
    profitabilityScore * 0.25 +
    efficiencyScore * 0.20 +
    leverageScore * 0.15 +
    trendScore * 0.15) - alertPenalty
  ));

  let rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  if (overall >= 85) rating = 'excellent';
  else if (overall >= 70) rating = 'good';
  else if (overall >= 50) rating = 'fair';
  else if (overall >= 30) rating = 'poor';
  else rating = 'critical';

  return {
    overall,
    liquidity: liquidityScore,
    profitability: profitabilityScore,
    efficiency: efficiencyScore,
    leverage: leverageScore,
    trend: trendScore,
    rating
  };
}
