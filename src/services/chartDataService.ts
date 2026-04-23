import { useState, useEffect, useCallback } from 'react';
import * as d3 from 'd3';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RechartsDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface RechartsTimeSeriesPoint {
  date: string;
  [key: string]: string | number;
}

export interface D3DataPoint {
  label: string;
  value: number;
  date?: Date;
  category?: string;
  meta?: Record<string, unknown>;
}

// OKAPIA Medical design system colors (no violet/purple per design requirements)
export const CHART_PALETTE = {
  primary: '#2563EB',
  secondary: '#0891B2',
  accent: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  neutral: '#6B7280',
  ramps: ['#2563EB', '#0891B2', '#059669', '#D97706', '#DC2626', '#0F766E', '#7C3AED'],
} as const;

// ---------------------------------------------------------------------------
// Recharts configurations
// ---------------------------------------------------------------------------

export const defaultLineChartConfig = {
  margin: { top: 10, right: 30, left: 0, bottom: 0 },
  strokeWidth: 2,
  dot: false,
  activeDot: { r: 5 },
  cartesianGridProps: { strokeDasharray: '3 3', stroke: '#F3F4F6' },
  xAxisProps: { tick: { fontSize: 12, fill: '#6B7280' }, tickLine: false, axisLine: false },
  yAxisProps: { tick: { fontSize: 12, fill: '#6B7280' }, tickLine: false, axisLine: false },
  tooltipProps: {
    contentStyle: {
      backgroundColor: '#111827',
      border: 'none',
      borderRadius: '8px',
      color: '#F9FAFB',
      fontSize: '12px',
    },
  },
} as const;

export const defaultBarChartConfig = {
  margin: { top: 10, right: 30, left: 0, bottom: 0 },
  barSize: 32,
  radius: [4, 4, 0, 0] as [number, number, number, number],
  cartesianGridProps: { strokeDasharray: '3 3', stroke: '#F3F4F6', vertical: false },
  xAxisProps: { tick: { fontSize: 12, fill: '#6B7280' }, tickLine: false, axisLine: false },
  yAxisProps: { tick: { fontSize: 12, fill: '#6B7280' }, tickLine: false, axisLine: false },
  tooltipProps: {
    contentStyle: {
      backgroundColor: '#111827',
      border: 'none',
      borderRadius: '8px',
      color: '#F9FAFB',
      fontSize: '12px',
    },
  },
} as const;

export const defaultPieChartConfig = {
  innerRadius: '55%',
  outerRadius: '80%',
  paddingAngle: 3,
  cx: '50%',
  cy: '50%',
  labelLine: false,
  tooltipProps: {
    contentStyle: {
      backgroundColor: '#111827',
      border: 'none',
      borderRadius: '8px',
      color: '#F9FAFB',
      fontSize: '12px',
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Data transformers
// ---------------------------------------------------------------------------

/**
 * Transforme un tableau d'objets en format Recharts [{name, value}].
 * Adapté pour les PieChart, BarChart simples.
 *
 * @example
 * const data = toRechartsFormat(rawRows, 'department_name', 'patient_count');
 */
export function toRechartsFormat(
  data: Record<string, unknown>[],
  labelKey: string,
  valueKey: string,
  extraKeys: string[] = []
): RechartsDataPoint[] {
  return data.map(row => ({
    name: String(row[labelKey] ?? ''),
    value: Number(row[valueKey] ?? 0),
    ...Object.fromEntries(extraKeys.map(k => [k, row[k]])),
  }));
}

/**
 * Transforme des données brutes en série temporelle Recharts.
 * La clé de date doit être parseable par new Date().
 *
 * @example
 * const series = toRechartsTimeSeries(rawRows, 'created_at', { revenue: 'amount', count: 'nb' });
 */
export function toRechartsTimeSeries(
  data: Record<string, unknown>[],
  dateKey: string,
  valueKeys: Record<string, string>,
  dateFormat: 'day' | 'month' | 'year' = 'day'
): RechartsTimeSeriesPoint[] {
  const formatDate = (rawDate: unknown): string => {
    const d = new Date(String(rawDate));
    if (isNaN(d.getTime())) return String(rawDate);
    if (dateFormat === 'month') return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    if (dateFormat === 'year') return String(d.getFullYear());
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  return data.map(row => ({
    date: formatDate(row[dateKey]),
    ...Object.fromEntries(
      Object.entries(valueKeys).map(([alias, key]) => [alias, Number(row[key] ?? 0)])
    ),
  }));
}

/**
 * Convertit des données brutes en format D3 [{label, value, date?}].
 *
 * @example
 * const d3Data = toD3Format(rawRows, 'name', 'total', 'date');
 */
export function toD3Format(
  data: Record<string, unknown>[],
  labelKey: string,
  valueKey: string,
  dateKey?: string
): D3DataPoint[] {
  return data.map(row => ({
    label: String(row[labelKey] ?? ''),
    value: Number(row[valueKey] ?? 0),
    ...(dateKey ? { date: new Date(String(row[dateKey])) } : {}),
    meta: row,
  }));
}

/**
 * Groupe un tableau par une clé et calcule la somme d'une valeur par groupe.
 * Retourne le résultat en format Recharts.
 *
 * @example
 * const byDept = groupAndSum(rows, 'department', 'revenue');
 */
export function groupAndSum(
  data: Record<string, unknown>[],
  groupKey: string,
  sumKey: string
): RechartsDataPoint[] {
  const rolled = d3.rollup(
    data,
    v => d3.sum(v, d => Number(d[sumKey] ?? 0)),
    d => String(d[groupKey] ?? 'Inconnu')
  );

  return Array.from(rolled.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Groupe par une clé et compte les occurrences.
 *
 * @example
 * const byStatus = groupAndCount(rows, 'status');
 */
export function groupAndCount(
  data: Record<string, unknown>[],
  groupKey: string
): RechartsDataPoint[] {
  const rolled = d3.rollup(
    data,
    v => v.length,
    d => String(d[groupKey] ?? 'Inconnu')
  );

  return Array.from(rolled.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Crée une échelle de couleurs ordinale D3 basée sur la palette OKAPIA.
 *
 * @example
 * const colorScale = createColorScale(['Cardiologie', 'Pédiatrie', 'Urgences']);
 * colorScale('Cardiologie'); // '#2563EB'
 */
export function createColorScale(domain: string[]) {
  return d3.scaleOrdinal<string>().domain(domain).range(CHART_PALETTE.ramps);
}

/**
 * Crée une échelle linéaire D3 avec domaine et range définis.
 *
 * @example
 * const yScale = createLinearScale([0, 1000], [chartHeight, 0]);
 */
export function createLinearScale(domain: [number, number], range: [number, number]) {
  return d3.scaleLinear().domain(domain).range(range).nice();
}

// ---------------------------------------------------------------------------
// React hook : useChartData
// ---------------------------------------------------------------------------

interface UseChartDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook générique qui récupère des données asynchrones, les transforme,
 * et expose les états loading / error.
 *
 * @example
 * const { data, loading } = useChartData(
 *   () => supabase.from('consultations').select('department, count'),
 *   rows => groupAndCount(rows, 'department')
 * );
 */
export function useChartData<TRaw extends Record<string, unknown>, TOut>(
  fetchFn: () => Promise<{ data: TRaw[] | null; error: unknown }>,
  transformFn: (raw: TRaw[]) => TOut[],
  deps: unknown[] = []
): UseChartDataState<TOut> {
  const [state, setState] = useState<UseChartDataState<TOut>>({
    data: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const { data, error } = await fetchFn();
      if (error) throw error;
      setState({ data: transformFn(data ?? []), loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des données.';
      setState({ data: [], loading: false, error: message });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return state;
}

// ---------------------------------------------------------------------------
// Formatting utilities (mirrors chartHelpers.ts for non-D3 contexts)
// ---------------------------------------------------------------------------

/** Formate un nombre en notation française (1 234 567). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

/** Formate un montant en USD. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
}

/** Formate une date ISO en date courte française (JJ/MM/AAAA). */
export function formatChartDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Formate une date ISO en mois abrégé + année. */
export function formatChartMonth(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}
