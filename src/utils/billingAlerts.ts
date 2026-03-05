import { supabase } from '../lib/supabase';
import { BillingAlert, AlertThresholds, BillingStatistics } from '../types/billingAnalytics';
import { Invoice } from '../types/database';

const DEFAULT_THRESHOLDS: AlertThresholds = {
  minRecoveryRate: 75,
  maxOverdueAmount: 10000,
  maxOverdueDays: 30,
  criticalBalanceThreshold: 5000,
  alertRecipients: [],
};

export async function getAlertThresholds(): Promise<AlertThresholds> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'billing_alert_thresholds')
      .maybeSingle();

    if (error) throw error;

    if (data?.value) {
      return { ...DEFAULT_THRESHOLDS, ...data.value };
    }

    return DEFAULT_THRESHOLDS;
  } catch (error) {
    console.error('Error fetching alert thresholds:', error);
    return DEFAULT_THRESHOLDS;
  }
}

export async function saveAlertThresholds(thresholds: AlertThresholds): Promise<void> {
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'billing_alert_thresholds',
        value: thresholds,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving alert thresholds:', error);
    throw error;
  }
}

export function checkRecoveryRateAlert(
  statistics: BillingStatistics,
  threshold: number
): BillingAlert | null {
  if (statistics.recoveryRate < threshold) {
    return {
      id: `recovery_rate_${Date.now()}`,
      type: 'recovery_rate',
      severity: statistics.recoveryRate < threshold * 0.8 ? 'critical' : 'high',
      title: 'Taux de recouvrement faible',
      message: `Le taux de recouvrement actuel (${statistics.recoveryRate.toFixed(1)}%) est inférieur au seuil minimum de ${threshold}%`,
      value: statistics.recoveryRate,
      threshold,
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };
  }
  return null;
}

export function checkOverdueInvoicesAlert(
  invoices: Invoice[],
  maxDays: number,
  maxAmount: number
): BillingAlert | null {
  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return false;
    const daysPast = (Date.now() - new Date(inv.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysPast > maxDays;
  });

  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.balance, 0);

  if (totalOverdue > maxAmount) {
    return {
      id: `overdue_${Date.now()}`,
      type: 'overdue_invoices',
      severity: totalOverdue > maxAmount * 2 ? 'critical' : 'high',
      title: 'Factures en retard importantes',
      message: `${overdueInvoices.length} factures en retard depuis plus de ${maxDays} jours, pour un montant total de ${totalOverdue.toFixed(2)} USD`,
      value: totalOverdue,
      threshold: maxAmount,
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };
  }
  return null;
}

export function checkNegativeCashFlowAlert(
  collected: number,
  pending: number
): BillingAlert | null {
  const netFlow = collected - pending;

  if (netFlow < 0) {
    return {
      id: `negative_flow_${Date.now()}`,
      type: 'negative_flow',
      severity: Math.abs(netFlow) > 5000 ? 'critical' : 'medium',
      title: 'Flux de trésorerie négatif',
      message: `Le flux de trésorerie net est négatif: ${netFlow.toFixed(2)} USD. Les dépenses dépassent les recettes.`,
      value: netFlow,
      threshold: 0,
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };
  }
  return null;
}

export function checkCriticalBalanceAlert(
  totalPending: number,
  threshold: number
): BillingAlert | null {
  if (totalPending > threshold) {
    return {
      id: `critical_balance_${Date.now()}`,
      type: 'critical_balance',
      severity: totalPending > threshold * 2 ? 'critical' : 'high',
      title: 'Solde impayé critique',
      message: `Le montant total des factures impayées (${totalPending.toFixed(2)} USD) dépasse le seuil critique de ${threshold} USD`,
      value: totalPending,
      threshold,
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };
  }
  return null;
}

export async function checkAllAlerts(
  statistics: BillingStatistics,
  invoices: Invoice[]
): Promise<BillingAlert[]> {
  const thresholds = await getAlertThresholds();
  const alerts: BillingAlert[] = [];

  const recoveryAlert = checkRecoveryRateAlert(statistics, thresholds.minRecoveryRate);
  if (recoveryAlert) alerts.push(recoveryAlert);

  const overdueAlert = checkOverdueInvoicesAlert(
    invoices,
    thresholds.maxOverdueDays,
    thresholds.maxOverdueAmount
  );
  if (overdueAlert) alerts.push(overdueAlert);

  const cashFlowAlert = checkNegativeCashFlowAlert(
    statistics.totalCollected,
    statistics.totalPending
  );
  if (cashFlowAlert) alerts.push(cashFlowAlert);

  const balanceAlert = checkCriticalBalanceAlert(
    statistics.totalPending,
    thresholds.criticalBalanceThreshold
  );
  if (balanceAlert) alerts.push(balanceAlert);

  return alerts;
}

export async function saveAlertToDatabase(alert: BillingAlert): Promise<void> {
  try {
    const { error } = await supabase
      .from('billing_alerts')
      .insert({
        alert_type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        value: alert.value,
        threshold: alert.threshold,
        acknowledged: alert.acknowledged,
        created_at: alert.createdAt,
      });

    if (error && error.code !== '42P01') {
      console.error('Error saving alert:', error);
    }
  } catch (error) {
    console.error('Error saving alert to database:', error);
  }
}

export async function acknowledgeAlert(alertId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('billing_alerts')
      .update({
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error && error.code !== '42P01') {
      console.error('Error acknowledging alert:', error);
    }
  } catch (error) {
    console.error('Error acknowledging alert:', error);
  }
}

export async function getAlertHistory(limit: number = 50): Promise<BillingAlert[]> {
  try {
    const { data, error } = await supabase
      .from('billing_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }

    return data?.map(d => ({
      id: d.id,
      type: d.alert_type,
      severity: d.severity,
      title: d.title,
      message: d.message,
      value: d.value,
      threshold: d.threshold,
      createdAt: d.created_at,
      acknowledged: d.acknowledged,
      acknowledgedBy: d.acknowledged_by,
      acknowledgedAt: d.acknowledged_at,
    })) || [];
  } catch (error) {
    console.error('Error fetching alert history:', error);
    return [];
  }
}

export function getSeverityColor(severity: BillingAlert['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function getSeverityIcon(severity: BillingAlert['severity']): string {
  switch (severity) {
    case 'critical':
      return 'AlertOctagon';
    case 'high':
      return 'AlertTriangle';
    case 'medium':
      return 'AlertCircle';
    case 'low':
      return 'Info';
    default:
      return 'Bell';
  }
}
