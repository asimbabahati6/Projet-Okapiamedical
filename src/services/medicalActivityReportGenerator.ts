import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '../types/database';
import { supabase } from '../lib/supabase';

const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dark: '#1e293b',
  light: '#f1f5f9'
};

interface MedicalActivityData {
  invoices: Invoice[];
  startDate: Date;
  endDate: Date;
}

export class MedicalActivityReportGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 20;
  private data: MedicalActivityData;

  constructor(data: MedicalActivityData) {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.data = data;
  }

  async generatePDF(): Promise<Blob> {
    this.addCoverPage();
    this.addExecutiveSummary();
    this.addTemporalAnalysis();
    this.addSummaryTables();
    this.addTrendAnalysis();
    this.addRecommendations();
    this.addAppendix();
    this.addPageNumbers();

    return this.doc.output('blob');
  }

  private addCoverPage(): void {
    this.doc.setFillColor(COLORS.primary);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(32);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RAPPORT FINANCIER', this.pageWidth / 2, 70, { align: 'center' });

    this.doc.setFontSize(24);
    this.doc.text('ACTIVITÉ MÉDICALE', this.pageWidth / 2, 85, { align: 'center' });

    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('OKAPIA MEDICAL', this.pageWidth / 2, 105, { align: 'center' });

    this.doc.setFontSize(16);
    this.doc.text('Période : Janvier - Juin 2024', this.pageWidth / 2, 125, { align: 'center' });

    this.doc.setFontSize(12);
    this.doc.text(
      `Généré le ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      this.pageWidth / 2,
      145,
      { align: 'center' }
    );

    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 200, 200);
    this.doc.text('DOCUMENT CONFIDENTIEL', this.pageWidth / 2, this.pageHeight - 20, { align: 'center' });
  }

  private addExecutiveSummary(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('1. RÉSUMÉ EXÉCUTIF');

    const stats = this.calculateStats();

    this.doc.setFillColor(COLORS.primary);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 80, 3, 3, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('CHIFFRES CLÉS', this.margin + 10, this.currentY + 12);

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    const keyMetrics = [
      `Chiffre d'affaires total : ${this.formatCurrency(stats.totalRevenue)}`,
      `Nombre total de factures : ${stats.totalInvoices}`,
      `Montant encaissé : ${this.formatCurrency(stats.paidAmount)} (${stats.collectionRate.toFixed(1)}%)`,
      `Montant en attente : ${this.formatCurrency(stats.pendingAmount)}`,
      `Taux de recouvrement : ${stats.collectionRate.toFixed(1)}%`,
      `Facture moyenne : ${this.formatCurrency(stats.averageInvoice)}`
    ];

    keyMetrics.forEach((metric, index) => {
      this.doc.text(metric, this.margin + 10, this.currentY + 25 + (index * 8));
    });

    this.currentY += 95;

    this.doc.setTextColor(COLORS.dark);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('POINTS SAILLANTS', this.margin, this.currentY);
    this.currentY += 7;

    const highlights = this.generateHighlights(stats);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    highlights.forEach(highlight => {
      this.doc.setDrawColor(COLORS.success);
      this.doc.setFillColor(COLORS.success);
      this.doc.circle(this.margin + 2, this.currentY - 1.5, 1.5, 'F');
      const lines = this.doc.splitTextToSize(highlight, this.pageWidth - 2 * this.margin - 10);
      this.doc.text(lines, this.margin + 7, this.currentY);
      this.currentY += lines.length * 5 + 2;
    });
  }

  private addTemporalAnalysis(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('2. ANALYSE PAR PÉRIODE');

    const monthlyData = this.getMonthlyData();

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(COLORS.dark);
    this.doc.text('2.1 Revenus Mensuels', this.margin, this.currentY);
    this.currentY += 7;

    const monthlyTableData = monthlyData.map(m => [
      m.month,
      m.invoiceCount.toString(),
      this.formatCurrency(m.revenue),
      this.formatCurrency(m.paid),
      this.formatCurrency(m.pending),
      `${m.collectionRate.toFixed(1)}%`
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Mois', 'Factures', 'CA Total', 'Encaissé', 'En attente', 'Taux']],
      body: monthlyTableData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, textColor: 255, fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 20, halign: 'center' }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('2.2 Analyse Trimestrielle', this.margin, this.currentY);
    this.currentY += 7;

    const quarterlyData = this.getQuarterlyData(monthlyData);
    const quarterlyTableData = quarterlyData.map(q => [
      q.quarter,
      q.invoiceCount.toString(),
      this.formatCurrency(q.revenue),
      this.formatCurrency(q.paid),
      `${q.collectionRate.toFixed(1)}%`
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Trimestre', 'Factures', 'CA Total', 'Encaissé', 'Taux']],
      body: quarterlyTableData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.secondary, fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 30, halign: 'center' }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;

    const comparison = this.getQuarterComparison(quarterlyData);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(COLORS.dark);

    const comparisonText = `Évolution T1 → T2 : ${comparison.revenueGrowth > 0 ? '+' : ''}${comparison.revenueGrowth.toFixed(1)}% de chiffre d'affaires`;
    this.doc.text(comparisonText, this.margin, this.currentY);
  }

  private addSummaryTables(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('3. TABLEAUX RÉCAPITULATIFS');

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(COLORS.dark);
    this.doc.text('3.1 Répartition par Statut', this.margin, this.currentY);
    this.currentY += 7;

    const byStatus = this.getInvoicesByStatus();
    const statusTableData = [
      ['Factures payées', byStatus.paid.count.toString(), this.formatCurrency(byStatus.paid.amount), `${byStatus.paid.percentage.toFixed(1)}%`],
      ['Factures en attente', byStatus.pending.count.toString(), this.formatCurrency(byStatus.pending.amount), `${byStatus.pending.percentage.toFixed(1)}%`],
      ['TOTAL', byStatus.total.count.toString(), this.formatCurrency(byStatus.total.amount), '100%']
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Statut', 'Nombre', 'Montant', '%']],
      body: statusTableData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, fontSize: 10 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 30, halign: 'center' }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('3.2 Répartition par Type de Service', this.margin, this.currentY);
    this.currentY += 7;

    const byService = this.getInvoicesByServiceType();
    const serviceTableData = byService.map(s => [
      s.category,
      s.count.toString(),
      this.formatCurrency(s.amount),
      `${s.percentage.toFixed(1)}%`
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Type de Service', 'Nombre', 'Montant', '%']],
      body: serviceTableData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, fontSize: 10 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 30, halign: 'center' }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('3.3 Top 10 Factures', this.margin, this.currentY);
    this.currentY += 7;

    const topInvoices = this.getTopInvoices(10);
    const topTableData = topInvoices.map(inv => [
      inv.invoice_number,
      new Date(inv.created_at).toLocaleDateString('fr-FR'),
      this.formatCurrency(inv.total_amount),
      inv.status === 'paid' ? 'Payée' : 'En attente'
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['N° Facture', 'Date', 'Montant', 'Statut']],
      body: topTableData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.secondary, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'center' }
      }
    });
  }

  private addTrendAnalysis(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('4. ANALYSE DES TENDANCES');

    const trends = this.analyzeTrends();

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(COLORS.dark);
    this.doc.text('4.1 Pics et Creux d\'Activité', this.margin, this.currentY);
    this.currentY += 7;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    this.doc.text(`• Mois le plus actif : ${trends.peakMonth} (${trends.peakInvoices} factures, ${this.formatCurrency(trends.peakRevenue)})`, this.margin + 5, this.currentY);
    this.currentY += 6;

    this.doc.text(`• Mois le moins actif : ${trends.lowMonth} (${trends.lowInvoices} factures, ${this.formatCurrency(trends.lowRevenue)})`, this.margin + 5, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('4.2 Délai Moyen de Paiement', this.margin, this.currentY);
    this.currentY += 7;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`• Délai moyen : ${trends.averagePaymentDelay} jours`, this.margin + 5, this.currentY);
    this.currentY += 6;
    this.doc.text(`• Délai minimum : ${trends.minPaymentDelay} jours`, this.margin + 5, this.currentY);
    this.currentY += 6;
    this.doc.text(`• Délai maximum : ${trends.maxPaymentDelay} jours`, this.margin + 5, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('4.3 Évolution du Taux de Recouvrement', this.margin, this.currentY);
    this.currentY += 7;

    const monthlyData = this.getMonthlyData();
    const collectionTableData = monthlyData.map(m => [
      m.month,
      `${m.collectionRate.toFixed(1)}%`,
      this.getTrendIndicator(m.collectionRate)
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Mois', 'Taux de Recouvrement', 'Tendance']],
      body: collectionTableData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary, fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 60, halign: 'center' },
        2: { cellWidth: 50, halign: 'center' }
      }
    });
  }

  private addRecommendations(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('5. RECOMMANDATIONS');

    const recommendations = this.generateRecommendations();

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(COLORS.dark);

    recommendations.forEach((rec, index) => {
      if (this.currentY > this.pageHeight - 40) {
        this.doc.addPage();
        this.currentY = 30;
      }

      this.doc.setFillColor(COLORS.light);
      this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 2, 2, 'F');

      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${index + 1}. ${rec.title}`, this.margin + 5, this.currentY + 7);

      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      const lines = this.doc.splitTextToSize(rec.description, this.pageWidth - 2 * this.margin - 10);
      this.doc.text(lines.slice(0, 2), this.margin + 5, this.currentY + 14);

      this.currentY += 30;
    });
  }

  private addAppendix(): void {
    this.doc.addPage();
    this.currentY = 30;

    this.addSectionTitle('6. ANNEXES');

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(COLORS.dark);
    this.doc.text('6.1 Méthodologie de Calcul', this.margin, this.currentY);
    this.currentY += 7;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    const methodologyItems = [
      'Chiffre d\'affaires : Somme de toutes les factures émises sur la période',
      'Taux de recouvrement : (Montant encaissé / Montant facturé) × 100',
      'Délai de paiement : Nombre de jours entre la date de facture et la date de paiement',
      'Facture moyenne : Chiffre d\'affaires total / Nombre de factures'
    ];

    methodologyItems.forEach(item => {
      const lines = this.doc.splitTextToSize(`• ${item}`, this.pageWidth - 2 * this.margin - 5);
      this.doc.text(lines, this.margin + 5, this.currentY);
      this.currentY += lines.length * 5 + 2;
    });

    this.currentY += 10;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('6.2 Définitions des Indicateurs', this.margin, this.currentY);
    this.currentY += 7;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    const definitions = [
      'CA (Chiffre d\'Affaires) : Montant total des ventes de services médicaux',
      'DSO (Days Sales Outstanding) : Délai moyen de recouvrement des créances',
      'Taux de recouvrement : Pourcentage des factures effectivement payées'
    ];

    definitions.forEach(def => {
      const lines = this.doc.splitTextToSize(`• ${def}`, this.pageWidth - 2 * this.margin - 5);
      this.doc.text(lines, this.margin + 5, this.currentY);
      this.currentY += lines.length * 5 + 2;
    });
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
        'OKAPIA MEDICAL - Rapport Activité Médicale',
        this.pageWidth / 2,
        this.pageHeight - 5,
        { align: 'center' }
      );
    }
  }

  private calculateStats() {
    const totalInvoices = this.data.invoices.length;
    const totalRevenue = this.data.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const paidInvoices = this.data.invoices.filter(inv => inv.status === 'paid');
    const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
    const pendingAmount = totalRevenue - paidAmount;
    const collectionRate = totalRevenue > 0 ? (paidAmount / totalRevenue) * 100 : 0;
    const averageInvoice = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    return {
      totalInvoices,
      totalRevenue,
      paidAmount,
      pendingAmount,
      collectionRate,
      averageInvoice,
      paidCount: paidInvoices.length,
      pendingCount: totalInvoices - paidInvoices.length
    };
  }

  private getMonthlyData() {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'];
    const monthlyData = [];

    for (let i = 0; i < 6; i++) {
      const monthInvoices = this.data.invoices.filter(inv => {
        const invDate = new Date(inv.created_at);
        return invDate.getMonth() === i;
      });

      const revenue = monthInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const paid = monthInvoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
      const pending = revenue - paid;
      const collectionRate = revenue > 0 ? (paid / revenue) * 100 : 0;

      monthlyData.push({
        month: months[i],
        monthIndex: i,
        invoiceCount: monthInvoices.length,
        revenue,
        paid,
        pending,
        collectionRate
      });
    }

    return monthlyData;
  }

  private getQuarterlyData(monthlyData: any[]) {
    return [
      {
        quarter: 'T1 2024 (Jan-Mar)',
        invoiceCount: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.invoiceCount, 0),
        revenue: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.revenue, 0),
        paid: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.paid, 0),
        collectionRate: 0
      },
      {
        quarter: 'T2 2024 (Avr-Jun)',
        invoiceCount: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.invoiceCount, 0),
        revenue: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.revenue, 0),
        paid: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.paid, 0),
        collectionRate: 0
      }
    ].map(q => ({
      ...q,
      collectionRate: q.revenue > 0 ? (q.paid / q.revenue) * 100 : 0
    }));
  }

  private getQuarterComparison(quarterlyData: any[]) {
    const q1Revenue = quarterlyData[0].revenue;
    const q2Revenue = quarterlyData[1].revenue;
    const revenueGrowth = q1Revenue > 0 ? ((q2Revenue - q1Revenue) / q1Revenue) * 100 : 0;

    return { revenueGrowth };
  }

  private getInvoicesByStatus() {
    const paid = this.data.invoices.filter(inv => inv.status === 'paid');
    const pending = this.data.invoices.filter(inv => inv.status === 'pending');

    const paidAmount = paid.reduce((sum, inv) => sum + inv.total_amount, 0);
    const pendingAmount = pending.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalAmount = paidAmount + pendingAmount;

    return {
      paid: {
        count: paid.length,
        amount: paidAmount,
        percentage: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
      },
      pending: {
        count: pending.length,
        amount: pendingAmount,
        percentage: totalAmount > 0 ? (pendingAmount / totalAmount) * 100 : 0
      },
      total: {
        count: this.data.invoices.length,
        amount: totalAmount
      }
    };
  }

  private getInvoicesByServiceType() {
    const categories: { [key: string]: { count: number; amount: number } } = {
      'Consultation': { count: 0, amount: 0 },
      'Examen': { count: 0, amount: 0 },
      'Traitement': { count: 0, amount: 0 }
    };

    this.data.invoices.forEach(inv => {
      const notes = inv.notes || '';
      if (notes.toLowerCase().includes('consultation')) {
        categories['Consultation'].count++;
        categories['Consultation'].amount += inv.total_amount;
      } else if (notes.toLowerCase().includes('examen') || notes.toLowerCase().includes('radio') || notes.toLowerCase().includes('scan') || notes.toLowerCase().includes('echo')) {
        categories['Examen'].count++;
        categories['Examen'].amount += inv.total_amount;
      } else {
        categories['Traitement'].count++;
        categories['Traitement'].amount += inv.total_amount;
      }
    });

    const totalAmount = Object.values(categories).reduce((sum, cat) => sum + cat.amount, 0);

    return Object.entries(categories).map(([category, data]) => ({
      category,
      count: data.count,
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
    }));
  }

  private getTopInvoices(limit: number) {
    return [...this.data.invoices]
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, limit);
  }

  private analyzeTrends() {
    const monthlyData = this.getMonthlyData();

    const sortedByRevenue = [...monthlyData].sort((a, b) => b.revenue - a.revenue);
    const peakMonth = sortedByRevenue[0];
    const lowMonth = sortedByRevenue[sortedByRevenue.length - 1];

    const paidInvoices = this.data.invoices.filter(inv => inv.status === 'paid' && inv.payment_date);
    const delays = paidInvoices.map(inv => {
      const createdDate = new Date(inv.created_at);
      const paidDate = new Date(inv.payment_date!);
      return Math.floor((paidDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    });

    const averagePaymentDelay = delays.length > 0 ? Math.round(delays.reduce((sum, d) => sum + d, 0) / delays.length) : 0;
    const minPaymentDelay = delays.length > 0 ? Math.min(...delays) : 0;
    const maxPaymentDelay = delays.length > 0 ? Math.max(...delays) : 0;

    return {
      peakMonth: peakMonth.month,
      peakInvoices: peakMonth.invoiceCount,
      peakRevenue: peakMonth.revenue,
      lowMonth: lowMonth.month,
      lowInvoices: lowMonth.invoiceCount,
      lowRevenue: lowMonth.revenue,
      averagePaymentDelay,
      minPaymentDelay,
      maxPaymentDelay
    };
  }

  private generateHighlights(stats: any): string[] {
    const highlights: string[] = [];

    highlights.push(`Génération d'un chiffre d'affaires de ${this.formatCurrency(stats.totalRevenue)} sur la période de 6 mois`);

    if (stats.collectionRate >= 70) {
      highlights.push(`Excellent taux de recouvrement de ${stats.collectionRate.toFixed(1)}%, au-dessus de l'objectif de 70%`);
    }

    highlights.push(`${stats.totalInvoices} factures émises avec une valeur moyenne de ${this.formatCurrency(stats.averageInvoice)}`);

    if (stats.paidCount >= stats.totalInvoices * 0.7) {
      highlights.push(`${stats.paidCount} factures payées sur ${stats.totalInvoices}, démontrant une bonne gestion des créances`);
    }

    return highlights;
  }

  private generateRecommendations() {
    const stats = this.calculateStats();
    const trends = this.analyzeTrends();
    const recommendations = [];

    if (stats.collectionRate < 70) {
      recommendations.push({
        title: 'Améliorer le recouvrement des créances',
        description: `Le taux de recouvrement actuel de ${stats.collectionRate.toFixed(1)}% est inférieur à l'objectif. Mettre en place des relances systématiques et envisager des incitations au paiement rapide.`
      });
    }

    if (trends.averagePaymentDelay > 30) {
      recommendations.push({
        title: 'Réduire les délais de paiement',
        description: `Le délai moyen de ${trends.averagePaymentDelay} jours est élevé. Proposer des remises pour paiement comptant ou exiger des acomptes.`
      });
    }

    recommendations.push({
      title: 'Optimiser les périodes creuses',
      description: `${trends.lowMonth} a connu une activité réduite. Développer des campagnes promotionnelles ciblées pour ces périodes.`
    });

    recommendations.push({
      title: 'Capitaliser sur les périodes de pointe',
      description: `${trends.peakMonth} a été le mois le plus performant. Analyser les facteurs de succès et les reproduire.`
    });

    return recommendations;
  }

  private getTrendIndicator(rate: number): string {
    if (rate >= 80) return 'Excellent ↑';
    if (rate >= 70) return 'Bon ✓';
    if (rate >= 60) return 'Moyen →';
    return 'Faible ↓';
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}

export async function generateMedicalActivityReport(startDate: Date, endDate: Date): Promise<Blob> {
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .like('invoice_number', 'FAC-2024-%')
    .order('created_at', { ascending: true });

  if (error || !invoices) {
    throw new Error('Erreur lors de la récupération des données');
  }

  const generator = new MedicalActivityReportGenerator({
    invoices,
    startDate,
    endDate
  });

  return generator.generatePDF();
}
