import { CashFlowDataPoint, ForecastDataPoint, ForecastResult } from '../types/billingAnalytics';

interface DataPoint {
  x: number;
  y: number;
}

function linearRegression(data: DataPoint[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  const sumX = data.reduce((sum, p) => sum + p.x, 0);
  const sumY = data.reduce((sum, p) => sum + p.y, 0);
  const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = data.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumY2 = data.reduce((sum, p) => sum + p.y * p.y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  const ssTotal = data.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
  const ssResidual = data.reduce((sum, p) => {
    const predicted = slope * p.x + intercept;
    return sum + Math.pow(p.y - predicted, 2);
  }, 0);

  const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

  return { slope, intercept, r2: Math.max(0, Math.min(1, r2)) };
}

function movingAverage(data: number[], window: number): number[] {
  if (data.length < window) return data;

  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length;
    result.push(avg);
  }
  return result;
}

function weightedMovingAverage(data: number[], window: number): number {
  if (data.length < window) window = data.length;

  const weights = Array.from({ length: window }, (_, i) => i + 1);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const recentData = data.slice(-window);
  const weighted = recentData.reduce((sum, val, i) => sum + val * weights[i], 0);

  return weighted / totalWeight;
}

function detectSeasonality(data: CashFlowDataPoint[]): boolean {
  if (data.length < 14) return false;

  const dayOfWeekAverages = new Map<number, number[]>();

  data.forEach(point => {
    const day = point.date.getDay();
    if (!dayOfWeekAverages.has(day)) {
      dayOfWeekAverages.set(day, []);
    }
    dayOfWeekAverages.get(day)!.push(point.collected);
  });

  const averages = Array.from(dayOfWeekAverages.values()).map(values =>
    values.reduce((sum, v) => sum + v, 0) / values.length
  );

  if (averages.length < 4) return false;

  const mean = averages.reduce((sum, v) => sum + v, 0) / averages.length;
  const variance = averages.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / averages.length;
  const stdDev = Math.sqrt(variance);

  const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

  return coefficientOfVariation > 0.3;
}

function calculateTrend(data: CashFlowDataPoint[]): 'increasing' | 'stable' | 'decreasing' {
  if (data.length < 3) return 'stable';

  const points: DataPoint[] = data.map((d, i) => ({
    x: i,
    y: d.collected,
  }));

  const { slope } = linearRegression(points);

  const avgValue = data.reduce((sum, d) => sum + d.collected, 0) / data.length;
  const relativeSlope = avgValue > 0 ? slope / avgValue : 0;

  if (relativeSlope > 0.05) return 'increasing';
  if (relativeSlope < -0.05) return 'decreasing';
  return 'stable';
}

function generateForecast(
  historicalData: CashFlowDataPoint[],
  daysToForecast: number
): ForecastDataPoint[] {
  if (historicalData.length < 3) {
    return [];
  }

  const collectedValues = historicalData.map(d => d.collected);
  const points: DataPoint[] = historicalData.map((d, i) => ({
    x: i,
    y: d.collected,
  }));

  const { slope, intercept, r2 } = linearRegression(points);

  const recentAvg = weightedMovingAverage(collectedValues, Math.min(7, collectedValues.length));

  const stdDev = Math.sqrt(
    collectedValues.reduce((sum, val) => {
      const predicted = slope * collectedValues.indexOf(val) + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0) / collectedValues.length
  );

  const lastDate = historicalData[historicalData.length - 1].date;
  const forecasts: ForecastDataPoint[] = [];

  for (let i = 1; i <= daysToForecast; i++) {
    const x = historicalData.length + i - 1;
    const linearPrediction = slope * x + intercept;
    const realisticValue = Math.max(0, (linearPrediction * 0.6 + recentAvg * 0.4));

    const optimisticValue = Math.max(0, realisticValue + stdDev);
    const pessimisticValue = Math.max(0, realisticValue - stdDev * 0.8);

    const confidence = Math.max(0, Math.min(1, r2 * Math.exp(-i / 10)));

    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);

    forecasts.push({
      date: forecastDate,
      optimistic: optimisticValue,
      realistic: realisticValue,
      pessimistic: pessimisticValue,
      confidence,
    });
  }

  return forecasts;
}

export function forecastCashFlow(
  historicalData: CashFlowDataPoint[],
  period: 7 | 14 | 30 = 7
): ForecastResult {
  if (historicalData.length < 3) {
    return {
      period: `${period} jours`,
      forecasts: [],
      historicalData,
      accuracy: 0,
      trend: 'stable',
      seasonalPattern: false,
    };
  }

  const forecasts = generateForecast(historicalData, period);
  const trend = calculateTrend(historicalData);
  const seasonalPattern = detectSeasonality(historicalData);

  const accuracy = forecasts.length > 0
    ? forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length
    : 0;

  return {
    period: `${period} jours`,
    forecasts,
    historicalData,
    accuracy: accuracy * 100,
    trend,
    seasonalPattern,
  };
}

export function calculateRecoveryProbability(
  invoiceAmount: number,
  daysPastDue: number,
  patientPaymentHistory: number[]
): number {
  const baseRate = 0.85;

  const timeDecay = Math.exp(-daysPastDue / 60);

  const historyFactor = patientPaymentHistory.length > 0
    ? patientPaymentHistory.reduce((sum, paid) => sum + paid, 0) / (patientPaymentHistory.length * 100)
    : 0.5;

  const amountFactor = invoiceAmount > 1000 ? 0.85 : 1.0;

  const probability = baseRate * timeDecay * historyFactor * amountFactor;

  return Math.max(0.05, Math.min(0.95, probability));
}

export function predictAveragePaymentDelay(historicalDelays: number[]): {
  predicted: number;
  min: number;
  max: number;
} {
  if (historicalDelays.length === 0) {
    return { predicted: 15, min: 7, max: 30 };
  }

  const sorted = [...historicalDelays].sort((a, b) => a - b);
  const recentDelays = sorted.slice(-10);

  const predicted = recentDelays.reduce((sum, d) => sum + d, 0) / recentDelays.length;
  const stdDev = Math.sqrt(
    recentDelays.reduce((sum, d) => sum + Math.pow(d - predicted, 2), 0) / recentDelays.length
  );

  return {
    predicted: Math.round(predicted),
    min: Math.max(0, Math.round(predicted - stdDev)),
    max: Math.round(predicted + stdDev * 1.5),
  };
}

export function analyzeCashFlowPattern(data: CashFlowDataPoint[]): {
  bestDays: number[];
  worstDays: number[];
  monthlyPattern: { week: number; average: number }[];
} {
  const dayOfWeekMap = new Map<number, number[]>();
  const weekOfMonthMap = new Map<number, number[]>();

  data.forEach(point => {
    const day = point.date.getDay();
    if (!dayOfWeekMap.has(day)) {
      dayOfWeekMap.set(day, []);
    }
    dayOfWeekMap.get(day)!.push(point.collected);

    const week = Math.floor((point.date.getDate() - 1) / 7);
    if (!weekOfMonthMap.has(week)) {
      weekOfMonthMap.set(week, []);
    }
    weekOfMonthMap.get(week)!.push(point.collected);
  });

  const dayAverages = Array.from(dayOfWeekMap.entries()).map(([day, values]) => ({
    day,
    average: values.reduce((sum, v) => sum + v, 0) / values.length,
  }));

  dayAverages.sort((a, b) => b.average - a.average);

  const bestDays = dayAverages.slice(0, 3).map(d => d.day);
  const worstDays = dayAverages.slice(-3).map(d => d.day);

  const monthlyPattern = Array.from(weekOfMonthMap.entries()).map(([week, values]) => ({
    week,
    average: values.reduce((sum, v) => sum + v, 0) / values.length,
  })).sort((a, b) => a.week - b.week);

  return { bestDays, worstDays, monthlyPattern };
}
