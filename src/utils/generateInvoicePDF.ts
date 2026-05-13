import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, InvoiceItem, Patient } from '../types/database';
import { OKAPIA_LOGO_BASE64 } from './logoBase64';

const CLINIC_NAME = 'OKAPIA Medical';
const CLINIC_ADDRESS = 'Chaussée Mzée Kabila n°16.881';
const CLINIC_CITY = 'Galerie Manfield Kinshasa-Ngaliema';
const CLINIC_COUNTRY = 'Kinshasa, République Démocratique du Congo';
const CLINIC_DIRECTION = '+243 817 659 057';
const CLINIC_RECEPTION = '+243 823 800 104';
const CLINIC_EMAIL = 'info@okapiahospital.com';
const CLINIC_WEBSITE = 'www.okapiamedical.com';

export async function generateInvoicePDF(
  invoice: Invoice,
  items: InvoiceItem[],
  patient?: Patient
): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo
  try {
    doc.addImage(
      `data:image/jpeg;base64,${OKAPIA_LOGO_BASE64}`,
      'JPEG',
      14,
      10,
      35,
      35
    );
  } catch {
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text(CLINIC_NAME, 14, 25);
  }

  // Clinic info - right aligned
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.text(CLINIC_NAME, pageWidth - 14, 16, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(CLINIC_ADDRESS, pageWidth - 14, 23, { align: 'right' });
  doc.text(CLINIC_CITY, pageWidth - 14, 28, { align: 'right' });
  doc.text(CLINIC_COUNTRY, pageWidth - 14, 33, { align: 'right' });
  doc.text(`Direction: ${CLINIC_DIRECTION}`, pageWidth - 14, 38, { align: 'right' });
  doc.text(`Réception: ${CLINIC_RECEPTION}`, pageWidth - 14, 43, { align: 'right' });
  doc.text(CLINIC_EMAIL, pageWidth - 14, 48, { align: 'right' });

  // Separator line
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.5);
  doc.line(14, 54, pageWidth - 14, 54);

  // Invoice title
  const displayNumber = invoice.invoice_number ?? (invoice as Record<string, unknown>).draft_number as string ?? 'BROUILLON';
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text('FACTURE', 14, 62);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`N: ${displayNumber}`, 14, 69);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString('fr-FR')}`, 14, 75);

  // Status badge
  const statusLabels: Record<string, string> = {
    paid: 'PAYEE',
    pending: 'EN ATTENTE',
    partial: 'PARTIEL',
    cancelled: 'ANNULEE',
    draft: 'BROUILLON',
  };
  const statusLabel = statusLabels[invoice.status] || invoice.status.toUpperCase();
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const statusColors: Record<string, [number, number, number]> = {
    paid: [22, 163, 74],
    pending: [202, 138, 4],
    partial: [37, 99, 235],
    cancelled: [220, 38, 38],
    draft: [107, 114, 128],
  };
  const sColor = statusColors[invoice.status] || [107, 114, 128];
  doc.setTextColor(sColor[0], sColor[1], sColor[2]);
  doc.text(statusLabel, 14, 82);
  doc.setFont('helvetica', 'normal');

  // Patient info - right block
  if (patient) {
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT', pageWidth - 14, 62, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`${patient.last_name} ${patient.first_name}`, pageWidth - 14, 69, { align: 'right' });
    if (patient.patient_number) {
      doc.text(`N° Dossier: ${patient.patient_number}`, pageWidth - 14, 75, { align: 'right' });
    }
    if (patient.phone) {
      doc.text(`Tél: ${patient.phone}`, pageWidth - 14, 81, { align: 'right' });
    }
  }

  // Items table
  const tableData = items.map((item, index) => [
    String(index + 1),
    item.description || '-',
    String(item.quantity || 1),
    `${(item.unit_price || 0).toLocaleString('fr-FR')} USD`,
    `${((item.quantity || 1) * (item.unit_price || 0)).toLocaleString('fr-FR')} USD`,
  ]);

  autoTable(doc, {
    startY: 92,
    head: [['#', 'Description', 'Qté', 'Prix Unitaire', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 140;

  // Totals section
  const totalsX = pageWidth - 80;
  let totalsY = finalY + 12;

  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(250, 250, 252);
  const boxHeight = invoice.net_to_pay && invoice.net_to_pay !== invoice.total_amount ? 52 : 40;
  doc.roundedRect(totalsX - 4, totalsY - 6, 70, boxHeight, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text('Sous-total:', totalsX, totalsY);
  doc.text(`${invoice.total_amount.toLocaleString('fr-FR')} USD`, pageWidth - 18, totalsY, { align: 'right' });

  if (invoice.net_to_pay && invoice.net_to_pay !== invoice.total_amount) {
    totalsY += 8;
    const tvaRate = (invoice as unknown as Record<string, number>).tva_rate || 16;
    const tvaAmount = (invoice as unknown as Record<string, number>).tva_amount || 0;
    doc.text(`TVA (${tvaRate}%):`, totalsX, totalsY);
    doc.text(`${tvaAmount.toLocaleString('fr-FR')} USD`, pageWidth - 18, totalsY, { align: 'right' });
  }

  totalsY += 8;
  doc.text('Payé:', totalsX, totalsY);
  doc.text(`${invoice.paid_amount.toLocaleString('fr-FR')} USD`, pageWidth - 18, totalsY, { align: 'right' });

  totalsY += 10;
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.3);
  doc.line(totalsX - 2, totalsY - 4, pageWidth - 16, totalsY - 4);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('NET A PAYER:', totalsX, totalsY);
  const netAmount = invoice.net_to_pay || invoice.balance || invoice.total_amount;
  doc.text(`${netAmount.toLocaleString('fr-FR')} USD`, pageWidth - 18, totalsY, { align: 'right' });

  // Payment method
  if (invoice.payment_method) {
    totalsY += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const methodLabels: Record<string, string> = {
      cash: 'Espèces',
      mobile_money: 'Mobile Money',
      bank_transfer: 'Virement bancaire',
      card: 'Carte bancaire',
      insurance: 'Assurance',
    };
    doc.text(`Mode de paiement: ${methodLabels[invoice.payment_method] || invoice.payment_method}`, totalsX, totalsY);
  }

  // Footer
  const footerY = 270;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, footerY, pageWidth - 14, footerY);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.text('Merci pour votre confiance. Ce document fait foi de facture.', 14, footerY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${CLINIC_NAME} - ${CLINIC_ADDRESS}, ${CLINIC_CITY}`, 14, footerY + 12);
  doc.text(`Générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 14, footerY + 12, { align: 'right' });

  return doc;
}
