import { BillingAnalyticsData, BillingStatistics } from '../types/billingAnalytics';
import { Invoice } from '../types/database';
import { formatCurrency, formatPercentage } from './billingCalculations';

export function exportAnalyticsToCSV(data: BillingAnalyticsData, periodLabel: string): void {
  const sections: string[] = [];

  sections.push('RAPPORT ANALYTIQUE DE FACTURATION');
  sections.push(`Période: ${periodLabel}`);
  sections.push(`Généré le: ${new Date().toLocaleString('fr-FR')}`);
  sections.push('');

  sections.push('=== STATISTIQUES GLOBALES ===');
  sections.push(`Total Facturé,${data.statistics.totalInvoiced.toFixed(2)} USD`);
  sections.push(`Total Collecté,${data.statistics.totalCollected.toFixed(2)} USD`);
  sections.push(`Total En Attente,${data.statistics.totalPending.toFixed(2)} USD`);
  sections.push(`Total En Retard,${data.statistics.totalOverdue.toFixed(2)} USD`);
  sections.push(`Taux de Recouvrement,${data.statistics.recoveryRate.toFixed(2)}%`);
  sections.push(`Montant Moyen de Paiement,${data.statistics.averagePaymentAmount.toFixed(2)} USD`);
  sections.push(`Délai Moyen de Paiement,${data.statistics.averagePaymentDelay.toFixed(1)} jours`);
  sections.push('');

  sections.push('=== RÉPARTITION DES FACTURES ===');
  sections.push(`Total de Factures,${data.statistics.invoicesCount.total}`);
  sections.push(`Factures Payées,${data.statistics.invoicesCount.paid}`);
  sections.push(`Factures En Attente,${data.statistics.invoicesCount.pending}`);
  sections.push(`Factures Partielles,${data.statistics.invoicesCount.partial}`);
  sections.push(`Factures Annulées,${data.statistics.invoicesCount.cancelled}`);
  sections.push('');

  if (data.paymentMethods.length > 0) {
    sections.push('=== MÉTHODES DE PAIEMENT ===');
    sections.push('Méthode,Montant (USD),Nombre,Pourcentage');
    data.paymentMethods.forEach(method => {
      sections.push(`${method.method},${method.amount.toFixed(2)},${method.count},${method.percentage.toFixed(1)}%`);
    });
    sections.push('');
  }

  if (data.comparison) {
    sections.push('=== COMPARAISON AVEC PÉRIODE PRÉCÉDENTE ===');
    sections.push(`Variation Facturé,${data.comparison.changePercentage.totalInvoiced > 0 ? '+' : ''}${data.comparison.changePercentage.totalInvoiced.toFixed(1)}%`);
    sections.push(`Variation Collecté,${data.comparison.changePercentage.totalCollected > 0 ? '+' : ''}${data.comparison.changePercentage.totalCollected.toFixed(1)}%`);
    sections.push(`Variation Taux Recouvrement,${data.comparison.changePercentage.recoveryRate > 0 ? '+' : ''}${data.comparison.changePercentage.recoveryRate.toFixed(1)}%`);
    sections.push('');
  }

  if (data.topPayersByAmount.length > 0) {
    sections.push('=== TOP 10 PAYEURS (PAR MONTANT) ===');
    sections.push('Patient,Numéro Patient,Montant Total (USD),Nombre de Paiements,Paiement Moyen (USD),Statut');
    data.topPayersByAmount.forEach(payer => {
      sections.push(
        `${payer.patientName},${payer.patientNumber},${payer.totalAmount.toFixed(2)},${payer.paymentCount},${payer.averagePayment.toFixed(2)},${payer.status}`
      );
    });
    sections.push('');
  }

  if (data.dailyRevenue.length > 0) {
    sections.push('=== REVENUS JOURNALIERS ===');
    sections.push('Date,Revenu (USD),Nombre de Factures,Facture Moyenne (USD)');
    data.dailyRevenue.forEach(day => {
      sections.push(
        `${new Date(day.date).toLocaleDateString('fr-FR')},${day.revenue.toFixed(2)},${day.invoicesCount},${day.averageInvoice.toFixed(2)}`
      );
    });
    sections.push('');
  }

  if (data.overdueBalances.length > 0) {
    sections.push('=== SOLDES EN RETARD ===');
    sections.push('Patient,Numéro Patient,Montant Dû (USD),Jours de Retard,Nombre de Factures');
    data.overdueBalances.forEach(balance => {
      sections.push(
        `${balance.patientName},${balance.patientNumber},${balance.totalOwed.toFixed(2)},${balance.daysPastDue},${balance.invoicesCount}`
      );
    });
    sections.push('');
  }

  if (data.forecast && data.forecast.forecasts.length > 0) {
    sections.push('=== PRÉVISIONS (7 PROCHAINS JOURS) ===');
    sections.push('Date,Pessimiste (USD),Réaliste (USD),Optimiste (USD),Confiance (%)');
    data.forecast.forecasts.slice(0, 7).forEach(forecast => {
      sections.push(
        `${new Date(forecast.date).toLocaleDateString('fr-FR')},${forecast.pessimistic.toFixed(2)},${forecast.realistic.toFixed(2)},${forecast.optimistic.toFixed(2)},${(forecast.confidence * 100).toFixed(0)}`
      );
    });
    sections.push('');
  }

  const csv = sections.join('\n');
  downloadFile(csv, `analytics-facturation-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

export function exportSummaryTableToCSV(
  dayStats: BillingStatistics,
  weekStats: BillingStatistics,
  monthStats: BillingStatistics
): void {
  const headers = [
    'Période',
    'Factures Émises',
    'Factures Payées',
    'Montant Collecté (USD)',
    'Solde Impayé (USD)',
    'Taux de Recouvrement (%)'
  ];

  const rows = [
    [
      'Aujourd\'hui',
      dayStats.invoicesCount.total.toString(),
      dayStats.invoicesCount.paid.toString(),
      dayStats.totalCollected.toFixed(2),
      dayStats.totalPending.toFixed(2),
      dayStats.recoveryRate.toFixed(1)
    ],
    [
      'Cette Semaine',
      weekStats.invoicesCount.total.toString(),
      weekStats.invoicesCount.paid.toString(),
      weekStats.totalCollected.toFixed(2),
      weekStats.totalPending.toFixed(2),
      weekStats.recoveryRate.toFixed(1)
    ],
    [
      'Ce Mois',
      monthStats.invoicesCount.total.toString(),
      monthStats.invoicesCount.paid.toString(),
      monthStats.totalCollected.toFixed(2),
      monthStats.totalPending.toFixed(2),
      monthStats.recoveryRate.toFixed(1)
    ]
  ];

  const csv = [
    'TABLEAU RÉCAPITULATIF PAR PÉRIODE',
    `Généré le: ${new Date().toLocaleString('fr-FR')}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  downloadFile(csv, `resume-facturation-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

export function exportInvoicesToDetailedCSV(invoices: Invoice[]): void {
  const headers = [
    'N° Facture',
    'Date Création',
    'Patient',
    'N° Patient',
    'Montant Total (USD)',
    'Montant Payé (USD)',
    'Solde (USD)',
    'Statut',
    'Méthode de Paiement',
    'Date de Paiement',
    'Jours de Retard'
  ];

  const rows = invoices.map(inv => {
    const created = new Date(inv.created_at);
    const daysPast = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));

    return [
      inv.invoice_number,
      created.toLocaleDateString('fr-FR'),
      inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : 'N/A',
      inv.patient?.patient_number || 'N/A',
      inv.total_amount.toFixed(2),
      inv.paid_amount.toFixed(2),
      inv.balance.toFixed(2),
      getStatusLabel(inv.status),
      inv.payment_method || 'N/A',
      inv.payment_date ? new Date(inv.payment_date).toLocaleDateString('fr-FR') : 'N/A',
      inv.status !== 'paid' && inv.status !== 'cancelled' ? daysPast.toString() : '0'
    ];
  });

  const csv = [
    'EXPORT DÉTAILLÉ DES FACTURES',
    `Généré le: ${new Date().toLocaleString('fr-FR')}`,
    `Nombre de factures: ${invoices.length}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  downloadFile(csv, `factures-detaille-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    partial: 'Partiel',
    paid: 'Payé',
    cancelled: 'Annulé',
  };
  return labels[status] || status;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: `${mimeType};charset=utf-8;` });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function formatPeriodLabel(period: 'today' | 'week' | 'month' | 'custom', startDate?: Date, endDate?: Date): string {
  if (period === 'custom' && startDate && endDate) {
    return `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`;
  }

  const labels: Record<string, string> = {
    today: 'Aujourd\'hui',
    week: 'Cette Semaine (7 derniers jours)',
    month: 'Ce Mois (30 derniers jours)',
  };

  return labels[period] || period;
}
