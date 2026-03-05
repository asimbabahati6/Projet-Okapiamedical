import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialReportData } from '../types/financialReport';

const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dark: '#1e293b',
  light: '#f1f5f9',
  white: '#ffffff'
};

const LOGO_PATH = '/okapia-logo.png';

export class FinancialReportPDFGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 20;
  private reportData: FinancialReportData;

  constructor(reportData: FinancialReportData) {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.reportData = reportData;
  }

  async generatePDF(): Promise<Blob> {
    this.addCoverPage();
    this.addTableOfContents();
    this.addExecutiveSummary();
    this.addIncomeStatement();
    this.addBalanceSheet();
    this.addCashFlowStatement();
    this.addFinancialRatios();
    this.addTrendAnalysis();
    this.addAlertsAndRecommendations();
    this.addPageNumbers();

    return this.doc.output('blob');
  }

  private addCoverPage(): void {
    this.doc.setFillColor(COLORS.primary);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    this.doc.setTextColor(COLORS.white);
    this.doc.setFontSize(36);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RAPPORT FINANCIER', this.pageWidth / 2, 80, { align: 'center' });

    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('OKAPIA MEDICAL', this.pageWidth / 2, 100, { align: 'center' });

    this.doc.setFontSize(18);
    this.doc.text(
      this.reportData.reportInfo.period.label,
      this.pageWidth / 2,
      120,
      { align: 'center' }
    );

    this.doc.setFontSize(12);
    this.doc.text(
      `Rapport N° ${this.reportData.reportInfo.reportNumber}`,
      this.pageWidth / 2,
      140,
      { align: 'center' }
    );

    this.doc.text(
      `Généré le ${new Date(this.reportData.reportInfo.generatedDate).toLocaleDateString('fr-FR')}`,
      this.pageWidth / 2,
      150,
      { align: 'center' }
    );

    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 200, 200);
    this.doc.text('CONFIDENTIEL', this.pageWidth / 2, this.pageHeight - 20, { align: 'center' });
  }

  private addTableOfContents(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('TABLE DES MATIÈRES');

    const contents = [
      { title: 'Résumé Exécutif', page: 3 },
      { title: 'Compte de Résultat', page: 4 },
      { title: 'Bilan Comptable', page: 5 },
      { title: 'Tableau des Flux de Trésorerie', page: 6 },
      { title: 'Ratios Financiers', page: 7 },
      { title: 'Analyse des Tendances', page: 8 },
      { title: 'Alertes et Recommandations', page: 9 }
    ];

    this.doc.setFontSize(11);
    contents.forEach((item, index) => {
      const y = this.currentY + (index * 10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(COLORS.dark);
      this.doc.text(item.title, this.margin, y);
      this.doc.text(String(item.page), this.pageWidth - this.margin - 10, y);
    });
  }

  private addExecutiveSummary(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('RÉSUMÉ EXÉCUTIF');

    this.addHealthScoreCard();
    this.addKeyHighlights();
    this.addMajorConcerns();
  }

  private addHealthScoreCard(): void {
    const score = this.reportData.executiveSummary.financialHealth.overall;
    const rating = this.reportData.executiveSummary.financialHealth.rating;

    this.doc.setFillColor(this.getScoreColor(score));
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 30, 3, 3, 'F');

    this.doc.setTextColor(COLORS.white);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Score de Santé Financière', this.margin + 10, this.currentY + 12);

    this.doc.setFontSize(36);
    this.doc.text(String(score), this.margin + 10, this.currentY + 25);

    this.doc.setFontSize(14);
    this.doc.text(`/ 100 - ${this.getRatingLabel(rating)}`, this.margin + 35, this.currentY + 25);

    this.currentY += 40;
  }

  private addKeyHighlights(): void {
    this.doc.setTextColor(COLORS.dark);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Points Clés', this.margin, this.currentY);
    this.currentY += 7;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.reportData.executiveSummary.keyHighlights.forEach((highlight, index) => {
      this.doc.setDrawColor(COLORS.success);
      this.doc.setFillColor(COLORS.success);
      this.doc.circle(this.margin + 2, this.currentY - 1.5, 1.5, 'F');

      const lines = this.doc.splitTextToSize(highlight, this.pageWidth - 2 * this.margin - 10);
      this.doc.text(lines, this.margin + 7, this.currentY);
      this.currentY += lines.length * 5 + 2;
    });

    this.currentY += 5;
  }

  private addMajorConcerns(): void {
    if (this.reportData.executiveSummary.majorConcerns.length === 0) return;

    this.doc.setTextColor(COLORS.dark);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Points d\'Attention', this.margin, this.currentY);
    this.currentY += 7;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.reportData.executiveSummary.majorConcerns.forEach((concern, index) => {
      this.doc.setDrawColor(COLORS.warning);
      this.doc.setFillColor(COLORS.warning);
      this.doc.circle(this.margin + 2, this.currentY - 1.5, 1.5, 'F');

      const lines = this.doc.splitTextToSize(concern, this.pageWidth - 2 * this.margin - 10);
      this.doc.text(lines, this.margin + 7, this.currentY);
      this.currentY += lines.length * 5 + 2;
    });
  }

  private addIncomeStatement(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('COMPTE DE RÉSULTAT');

    const income = this.reportData.incomeStatement;

    const tableData = [
      ['REVENUS', '', ''],
      ['  Consultations', this.formatCurrency(income.revenue.consultations), ''],
      ['  Procédures', this.formatCurrency(income.revenue.procedures), ''],
      ['  Pharmacie', this.formatCurrency(income.revenue.pharmacy), ''],
      ['  Laboratoire', this.formatCurrency(income.revenue.laboratory), ''],
      ['  Autres', this.formatCurrency(income.revenue.other), ''],
      ['Total Revenus', this.formatCurrency(income.revenue.total), 'bold'],
      ['', '', ''],
      ['COÛT DES REVENUS', '', ''],
      ['  Fournitures médicales', this.formatCurrency(income.costOfRevenue.medicalSupplies), ''],
      ['  Stock pharmacie', this.formatCurrency(income.costOfRevenue.pharmacyInventory), ''],
      ['  Fournitures laboratoire', this.formatCurrency(income.costOfRevenue.laboratorySupplies), ''],
      ['Total Coût des Revenus', this.formatCurrency(income.costOfRevenue.total), 'bold'],
      ['', '', ''],
      ['MARGE BRUTE', this.formatCurrency(income.grossProfit), 'bold'],
      [`(${income.grossMargin.toFixed(1)}%)`, '', ''],
      ['', '', ''],
      ['CHARGES OPÉRATIONNELLES', '', ''],
      ['  Salaires', this.formatCurrency(income.operatingExpenses.salaries), ''],
      ['  Loyer', this.formatCurrency(income.operatingExpenses.rent), ''],
      ['  Utilities', this.formatCurrency(income.operatingExpenses.utilities), ''],
      ['  Maintenance', this.formatCurrency(income.operatingExpenses.maintenance), ''],
      ['  Assurance', this.formatCurrency(income.operatingExpenses.insurance), ''],
      ['  Marketing', this.formatCurrency(income.operatingExpenses.marketing), ''],
      ['  Administratif', this.formatCurrency(income.operatingExpenses.administrative), ''],
      ['Total Charges', this.formatCurrency(income.operatingExpenses.total), 'bold'],
      ['', '', ''],
      ['RÉSULTAT OPÉRATIONNEL', this.formatCurrency(income.operatingIncome), 'bold'],
      [`(${income.operatingMargin.toFixed(1)}%)`, '', ''],
      ['', '', ''],
      ['RÉSULTAT NET', this.formatCurrency(income.netIncome), 'bold-highlight']
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Description', 'Montant (€)', '']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 11 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 50, halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.row.raw && data.row.raw[2] === 'bold') {
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.row.raw && data.row.raw[2] === 'bold-highlight') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = COLORS.light;
        }
      }
    });
  }

  private addBalanceSheet(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('BILAN COMPTABLE');

    const balance = this.reportData.balanceSheet;

    const tableData = [
      ['ACTIF', 'Montant (€)', 'PASSIF', 'Montant (€)'],
      ['', '', '', ''],
      ['ACTIF CIRCULANT', '', 'PASSIF CIRCULANT', ''],
      ['  Trésorerie', this.formatCurrency(balance.assets.current.cash), '  Dettes fournisseurs', this.formatCurrency(balance.liabilities.current.accountsPayable)],
      ['  Créances clients', this.formatCurrency(balance.assets.current.accountsReceivable), '  Dette court terme', this.formatCurrency(balance.liabilities.current.shortTermDebt)],
      ['  Stock', this.formatCurrency(balance.assets.current.inventory), '  Charges à payer', this.formatCurrency(balance.liabilities.current.accruedExpenses)],
      ['  Autres', this.formatCurrency(balance.assets.current.other), '  Autres', this.formatCurrency(balance.liabilities.current.other)],
      ['Total Actif Circulant', this.formatCurrency(balance.assets.current.total), 'Total Passif Circulant', this.formatCurrency(balance.liabilities.current.total)],
      ['', '', '', ''],
      ['ACTIF IMMOBILISÉ', '', 'PASSIF NON CIRCULANT', ''],
      ['  Équipements', this.formatCurrency(balance.assets.nonCurrent.equipment), '  Dette long terme', this.formatCurrency(balance.liabilities.nonCurrent.longTermDebt)],
      ['  Immobilier', this.formatCurrency(balance.assets.nonCurrent.property), '  Revenus différés', this.formatCurrency(balance.liabilities.nonCurrent.deferredRevenue)],
      ['  Investissements', this.formatCurrency(balance.assets.nonCurrent.investments), '  Autres', this.formatCurrency(balance.liabilities.nonCurrent.other)],
      ['Total Immobilisé', this.formatCurrency(balance.assets.nonCurrent.total), 'Total Non Circulant', this.formatCurrency(balance.liabilities.nonCurrent.total)],
      ['', '', '', ''],
      ['', '', 'CAPITAUX PROPRES', ''],
      ['', '', '  Capital', this.formatCurrency(balance.equity.capital)],
      ['', '', '  Résultat période', this.formatCurrency(balance.equity.currentPeriodProfit)],
      ['', '', 'Total Capitaux Propres', this.formatCurrency(balance.equity.total)],
      ['', '', '', ''],
      ['TOTAL ACTIF', this.formatCurrency(balance.assets.total), 'TOTAL PASSIF', this.formatCurrency(balance.liabilities.total + balance.equity.total)]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 60 },
        3: { cellWidth: 35, halign: 'right' }
      }
    });
  }

  private addCashFlowStatement(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('TABLEAU DES FLUX DE TRÉSORERIE');

    const cashFlow = this.reportData.cashFlowStatement;

    const tableData = [
      ['FLUX OPÉRATIONNELS', ''],
      ['  Résultat net', this.formatCurrency(cashFlow.operatingActivities.netIncome)],
      ['  Amortissements', this.formatCurrency(cashFlow.operatingActivities.depreciation)],
      ['  Variation créances', this.formatCurrency(cashFlow.operatingActivities.accountsReceivableChange)],
      ['  Variation stocks', this.formatCurrency(cashFlow.operatingActivities.inventoryChange)],
      ['  Variation dettes', this.formatCurrency(cashFlow.operatingActivities.accountsPayableChange)],
      ['Flux Opérationnels', this.formatCurrency(cashFlow.operatingActivities.total)],
      ['', ''],
      ['FLUX D\'INVESTISSEMENT', ''],
      ['  Achats équipements', this.formatCurrency(cashFlow.investingActivities.equipmentPurchases)],
      ['  Ventes équipements', this.formatCurrency(cashFlow.investingActivities.equipmentSales)],
      ['  Investissements', this.formatCurrency(cashFlow.investingActivities.investments)],
      ['Flux d\'Investissement', this.formatCurrency(cashFlow.investingActivities.total)],
      ['', ''],
      ['FLUX DE FINANCEMENT', ''],
      ['  Émission dette', this.formatCurrency(cashFlow.financingActivities.debtIssuance)],
      ['  Remboursement dette', this.formatCurrency(cashFlow.financingActivities.debtRepayment)],
      ['  Dividendes', this.formatCurrency(cashFlow.financingActivities.dividends)],
      ['Flux de Financement', this.formatCurrency(cashFlow.financingActivities.total)],
      ['', ''],
      ['VARIATION NETTE TRÉSORERIE', this.formatCurrency(cashFlow.netCashFlow)],
      ['Trésorerie début période', this.formatCurrency(cashFlow.beginningCash)],
      ['Trésorerie fin période', this.formatCurrency(cashFlow.endingCash)]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Description', 'Montant (€)']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 50, halign: 'right' }
      }
    });
  }

  private addFinancialRatios(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('RATIOS FINANCIERS');

    const ratios = this.reportData.ratios;

    this.addRatioSection('Ratios de Liquidité', [
      ['Ratio de liquidité générale', ratios.liquidity.currentRatio.toFixed(2), '> 1.5'],
      ['Ratio de liquidité immédiate', ratios.liquidity.quickRatio.toFixed(2), '> 1.0'],
      ['Ratio de trésorerie', ratios.liquidity.cashRatio.toFixed(2), '> 0.5'],
      ['Fonds de roulement', this.formatCurrency(ratios.liquidity.workingCapital), '> 0']
    ]);

    this.addRatioSection('Ratios de Rentabilité', [
      ['Marge brute', `${ratios.profitability.grossMargin.toFixed(1)}%`, '> 40%'],
      ['Marge opérationnelle', `${ratios.profitability.operatingMargin.toFixed(1)}%`, '> 15%'],
      ['Marge nette', `${ratios.profitability.netMargin.toFixed(1)}%`, '> 10%'],
      ['ROA', `${ratios.profitability.returnOnAssets.toFixed(1)}%`, '> 5%'],
      ['ROE', `${ratios.profitability.returnOnEquity.toFixed(1)}%`, '> 15%']
    ]);

    this.addRatioSection('Ratios d\'Efficacité', [
      ['Rotation actifs', ratios.efficiency.assetTurnover.toFixed(2), '> 1.0'],
      ['Rotation créances', ratios.efficiency.receivablesTurnover.toFixed(2), '> 6.0'],
      ['DSO (jours)', Math.round(ratios.efficiency.daysRevenueOutstanding).toString(), '< 60'],
      ['Rotation stocks', ratios.efficiency.inventoryTurnover.toFixed(2), '> 4.0']
    ]);
  }

  private addRatioSection(title: string, ratios: string[][]): void {
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = 30;
    }

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(COLORS.dark);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 7;

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Ratio', 'Valeur', 'Cible']],
      body: ratios,
      theme: 'grid',
      headStyles: { fillColor: COLORS.secondary, fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addTrendAnalysis(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('ANALYSE DES TENDANCES');

    const trend = this.reportData.trendAnalysis;

    this.addTrendIndicator('Revenus', trend.revenue.trend, trend.revenue.growthRate);
    this.addTrendIndicator('Dépenses', trend.expenses.trend, trend.expenses.growthRate);
    this.addTrendIndicator('Rentabilité', trend.profitability.trend, trend.profitability.changeRate);
    this.addTrendIndicator('Flux de Trésorerie', trend.cashFlow.trend, 0);
  }

  private addTrendIndicator(label: string, trend: string, value: number): void {
    const trendColors: any = {
      increasing: COLORS.success,
      decreasing: COLORS.danger,
      stable: COLORS.secondary,
      improving: COLORS.success,
      declining: COLORS.danger,
      positive: COLORS.success,
      negative: COLORS.danger
    };

    this.doc.setFillColor(trendColors[trend] || COLORS.secondary);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 15, 2, 2, 'F');

    this.doc.setTextColor(COLORS.white);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(label, this.margin + 5, this.currentY + 7);

    this.doc.setFontSize(10);
    this.doc.text(
      `${this.getTrendLabel(trend)} ${value !== 0 ? `(${value > 0 ? '+' : ''}${value.toFixed(1)}%)` : ''}`,
      this.margin + 5,
      this.currentY + 12
    );

    this.currentY += 20;
  }

  private addAlertsAndRecommendations(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('ALERTES ET RECOMMANDATIONS');

    if (this.reportData.alerts.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(COLORS.dark);
      this.doc.text('Alertes', this.margin, this.currentY);
      this.currentY += 7;

      this.reportData.alerts.slice(0, 3).forEach(alert => {
        this.addAlertBox(alert.title, alert.description, alert.severity);
      });
    }

    this.currentY += 10;

    if (this.reportData.recommendations.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Recommandations Prioritaires', this.margin, this.currentY);
      this.currentY += 7;

      this.reportData.recommendations.slice(0, 3).forEach(rec => {
        this.addRecommendationBox(rec.title, rec.description, rec.priority);
      });
    }
  }

  private addAlertBox(title: string, description: string, severity: string): void {
    if (this.currentY > this.pageHeight - 40) {
      this.doc.addPage();
      this.currentY = 30;
    }

    const severityColors: any = {
      critical: COLORS.danger,
      high: COLORS.warning,
      medium: '#fb923c',
      low: COLORS.secondary
    };

    this.doc.setDrawColor(severityColors[severity]);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20);

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(COLORS.dark);
    this.doc.text(title, this.margin + 3, this.currentY + 5);

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(description, this.pageWidth - 2 * this.margin - 10);
    this.doc.text(lines.slice(0, 2), this.margin + 3, this.currentY + 10);

    this.currentY += 25;
  }

  private addRecommendationBox(title: string, description: string, priority: string): void {
    if (this.currentY > this.pageHeight - 40) {
      this.doc.addPage();
      this.currentY = 30;
    }

    this.doc.setFillColor(COLORS.light);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 'F');

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(COLORS.dark);
    this.doc.text(title, this.margin + 3, this.currentY + 5);

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(description, this.pageWidth - 2 * this.margin - 10);
    this.doc.text(lines.slice(0, 2), this.margin + 3, this.currentY + 10);

    this.currentY += 25;
  }

  private addSectionTitle(title: string): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(COLORS.primary);
    this.doc.text(title, this.margin, this.currentY);

    this.doc.setDrawColor(COLORS.primary);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY + 2, this.pageWidth - this.margin, this.currentY + 2);

    this.currentY += 10;
  }

  private addPageNumbers(): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 2; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(9);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `Page ${i - 1} sur ${pageCount - 1}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );

      this.doc.text(
        'CONFIDENTIEL - OKAPIA MEDICAL',
        this.pageWidth / 2,
        this.pageHeight - 5,
        { align: 'center' }
      );
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  private getScoreColor(score: number): string {
    if (score >= 85) return COLORS.success;
    if (score >= 70) return '#10b981';
    if (score >= 50) return COLORS.warning;
    if (score >= 30) return '#fb923c';
    return COLORS.danger;
  }

  private getRatingLabel(rating: string): string {
    const labels: any = {
      excellent: 'Excellent',
      good: 'Bon',
      fair: 'Moyen',
      poor: 'Faible',
      critical: 'Critique'
    };
    return labels[rating] || rating;
  }

  private getTrendLabel(trend: string): string {
    const labels: any = {
      increasing: 'En hausse',
      decreasing: 'En baisse',
      stable: 'Stable',
      improving: 'En amélioration',
      declining: 'En déclin',
      positive: 'Positif',
      negative: 'Négatif'
    };
    return labels[trend] || trend;
  }
}

export async function generateFinancialReportPDF(reportData: FinancialReportData): Promise<Blob> {
  const generator = new FinancialReportPDFGenerator(reportData);
  return generator.generatePDF();
}
