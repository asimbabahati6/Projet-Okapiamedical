import { FinancialMetrics } from '../hooks/finance/useFinancialAnalytics';

function downloadFile(content: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function fmtCurrency(value: number): string {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}

function fmtPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function exportFinancialAnalyticsToCSV(
  data: FinancialMetrics,
  periodLabel: string
): void {
  const lines: string[] = [];

  lines.push('RAPPORT FINANCIER GLOBAL');
  lines.push(`Période;${periodLabel}`);
  lines.push(`Généré le;${new Date().toLocaleString('fr-FR')}`);
  lines.push('');

  lines.push('=== INDICATEURS CLÉS ===');
  lines.push(`Revenus Totaux;${fmtCurrency(data.revenue.total)}`);
  lines.push(`Dépenses Totales;${fmtCurrency(data.expenses.total)}`);
  lines.push(`Bénéfice Net;${fmtCurrency(data.profitLoss.net)}`);
  lines.push(`Bénéfice Brut;${fmtCurrency(data.profitLoss.gross)}`);
  lines.push(`Marge Bénéficiaire;${fmtPercent(data.profitLoss.margin)}`);
  lines.push('');

  lines.push('=== TENDANCES (vs période précédente) ===');
  lines.push(`Tendance Revenus;${data.revenue.trend >= 0 ? '+' : ''}${fmtPercent(data.revenue.trend)}`);
  lines.push(`Tendance Dépenses;${data.expenses.trend >= 0 ? '+' : ''}${fmtPercent(data.expenses.trend)}`);
  lines.push(`Tendance Bénéfice;${data.profitLoss.trend >= 0 ? '+' : ''}${fmtPercent(data.profitLoss.trend)}`);
  lines.push('');

  lines.push('=== FLUX DE TRÉSORERIE ===');
  lines.push(`Entrées;${fmtCurrency(data.cashFlow.incoming)}`);
  lines.push(`Sorties;${fmtCurrency(data.cashFlow.outgoing)}`);
  lines.push(`Solde;${fmtCurrency(data.cashFlow.balance)}`);
  lines.push('');

  if (data.revenue.bySource.length > 0) {
    lines.push('=== SOURCES DE REVENUS ===');
    lines.push('Source;Montant;Part (%)');
    data.revenue.bySource
      .sort((a, b) => b.amount - a.amount)
      .forEach((s) => {
        const pct = data.revenue.total > 0 ? (s.amount / data.revenue.total) * 100 : 0;
        lines.push(`${s.source};${fmtCurrency(s.amount)};${fmtPercent(pct)}`);
      });
    lines.push('');
  }

  if (data.expenses.byCategory.length > 0) {
    lines.push('=== RÉPARTITION DES DÉPENSES ===');
    lines.push('Catégorie;Montant;Part (%)');
    data.expenses.byCategory
      .sort((a, b) => b.amount - a.amount)
      .forEach((c) => {
        lines.push(`${c.category};${fmtCurrency(c.amount)};${fmtPercent(c.percentage)}`);
      });
    lines.push('');
  }

  if (data.revenue.byPeriod.length > 0) {
    lines.push('=== REVENUS PAR JOUR ===');
    lines.push('Date;Montant');
    data.revenue.byPeriod.forEach((p) => {
      lines.push(`${new Date(p.date).toLocaleDateString('fr-FR')};${fmtCurrency(p.amount)}`);
    });
    lines.push('');
  }

  if (data.expenses.byPeriod.length > 0) {
    lines.push('=== DÉPENSES PAR JOUR ===');
    lines.push('Date;Montant');
    data.expenses.byPeriod.forEach((p) => {
      lines.push(`${new Date(p.date).toLocaleDateString('fr-FR')};${fmtCurrency(p.amount)}`);
    });
    lines.push('');
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  downloadFile(lines.join('\n'), `rapport-financier-${dateStr}.csv`);
}
