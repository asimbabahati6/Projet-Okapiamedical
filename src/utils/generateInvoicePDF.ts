import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Invoice, InvoiceItem, Patient } from '../types/database';

const BRAND_BLUE = '#2563eb';
const BRAND_BLUE_LIGHT = '#eff6ff';
const TEXT_DARK = '#111827';
const TEXT_GRAY = '#6b7280';
const GREEN_STAMP = '#16a34a';

function drawStethoscopeIcon(doc: jsPDF, x: number, y: number, size: number, color: string) {
  const [r, g, b] = hexToRgb(color);
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(size * 0.06);
  doc.setFillColor(r, g, b);

  const cx = x + size * 0.5;
  const headR = size * 0.22;
  doc.circle(cx, y + headR, headR, 'S');

  const tubeStartX = cx + headR;
  const tubeStartY = y + headR;
  doc.line(tubeStartX, tubeStartY, tubeStartX + size * 0.15, tubeStartY + size * 0.2);
  doc.line(x + headR * 0.3, tubeStartY, x + headR * 0.15, tubeStartY + size * 0.2);

  doc.setLineWidth(size * 0.05);
  const earR = size * 0.18;
  doc.circle(x + size * 0.5, y + size * 0.62, earR, 'S');

  doc.setFillColor(r, g, b);
  doc.circle(x + size * 0.5, y + size * 0.62, size * 0.08, 'F');
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function setColor(doc: jsPDF, hex: string, type: 'fill' | 'draw' | 'text' = 'fill') {
  const [r, g, b] = hexToRgb(hex);
  if (type === 'fill') doc.setFillColor(r, g, b);
  else if (type === 'draw') doc.setDrawColor(r, g, b);
  else doc.setTextColor(r, g, b);
}

function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} USD`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export async function generateInvoicePDF(
  invoice: Invoice,
  items: InvoiceItem[],
  patient?: Patient
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;

  const subtotal = invoice.total_amount;
  const tvaRate = (invoice as any).tva_rate ?? 16;
  const tvaAmount = (invoice as any).tva_amount ?? subtotal * (tvaRate / 100);
  const netToPay = (invoice as any).net_to_pay ?? subtotal + tvaAmount;
  const isPaid = invoice.status === 'paid';
  const displayNumber = invoice.invoice_number ?? (invoice as any).draft_number ?? 'BROUILLON';

  // ──────────────────────────────────────────────────────────────────────────
  // HEADER
  // ──────────────────────────────────────────────────────────────────────────
  setColor(doc, BRAND_BLUE, 'fill');
  doc.rect(0, 0, pageW, 38, 'F');

  drawStethoscopeIcon(doc, margin - 2, 5, 18, '#ffffff');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('Okapia Medical', margin + 20, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(219, 234, 254);
  doc.text('Av. Kasa-Vubu, Commune de la Gombe, Kinshasa — RDC', margin + 20, 22);
  doc.text('Tel: +243 997 000 000  |  Email: contact@okapia-medical.cd', margin + 20, 27);
  doc.text('www.okapia-medical.cd', margin + 20, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('FACTURE', pageW - margin, 20, { align: 'right' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(displayNumber, pageW - margin, 28, { align: 'right' });

  // ──────────────────────────────────────────────────────────────────────────
  // PATIENT + METADATA BLOC
  // ──────────────────────────────────────────────────────────────────────────
  let y = 48;

  setColor(doc, BRAND_BLUE_LIGHT, 'fill');
  doc.roundedRect(margin, y, (pageW - 2 * margin) * 0.56, 36, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor(doc, BRAND_BLUE, 'text');
  doc.text('FACTURÉ À', margin + 5, y + 8);

  setColor(doc, TEXT_DARK, 'text');
  doc.setFontSize(11);
  const patName = patient
    ? `${patient.first_name} ${patient.last_name}`
    : `${invoice.patient?.first_name ?? ''} ${invoice.patient?.last_name ?? ''}`.trim() || 'Patient';
  doc.text(patName, margin + 5, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setColor(doc, TEXT_GRAY, 'text');
  const patObj = patient ?? invoice.patient;
  if (patObj?.patient_number) doc.text(`N° patient: ${patObj.patient_number}`, margin + 5, y + 23);
  if (patObj?.phone) doc.text(`Tel: ${patObj.phone}`, margin + 5, y + 29);
  if (patObj?.email) doc.text(`Email: ${patObj.email}`, margin + 5, y + 35);

  const metaX = pageW - margin - 72;
  setColor(doc, '#f9fafb', 'fill');
  doc.roundedRect(metaX, y, 72, 36, 3, 3, 'F');
  setColor(doc, '#e5e7eb', 'draw');
  doc.setLineWidth(0.3);
  doc.roundedRect(metaX, y, 72, 36, 3, 3, 'S');

  const metaRows = [
    ['N° Facture:', displayNumber],
    ['Date émission:', formatDate(invoice.created_at)],
    ['Date échéance:', addDays(invoice.created_at, 30)],
    ['Statut:', getStatusLabelFr(invoice.status)],
  ];

  metaRows.forEach(([label, value], idx) => {
    const rowY = y + 8 + idx * 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setColor(doc, TEXT_GRAY, 'text');
    doc.text(label, metaX + 4, rowY);
    doc.setFont('helvetica', 'normal');
    setColor(doc, TEXT_DARK, 'text');
    doc.text(value, metaX + 72 - 4, rowY, { align: 'right' });
  });

  y += 44;

  // ──────────────────────────────────────────────────────────────────────────
  // TABLE DES ACTES
  // ──────────────────────────────────────────────────────────────────────────
  const tableBody = items.map((item) => [
    item.description,
    item.item_type ? getItemTypeFr(item.item_type) : '—',
    item.quantity.toString(),
    formatCurrency(item.unit_price ?? 0),
    formatCurrency(item.total_price ?? (item.quantity * (item.unit_price ?? 0))),
  ]);

  if (tableBody.length === 0) {
    tableBody.push(['Aucun acte enregistré', '—', '—', '—', '—']);
  }

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Type', 'Qté', 'Prix Unitaire', 'Total HT']],
    body: tableBody,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: hexToRgb(BRAND_BLUE),
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: hexToRgb(TEXT_DARK),
    },
    alternateRowStyles: {
      fillColor: hexToRgb(BRAND_BLUE_LIGHT),
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'head' && data.column.index >= 2) {
        data.cell.styles.halign = 'right';
      }
    },
    theme: 'grid',
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TAMPON "PAYÉ" (si statut paid)
  // ──────────────────────────────────────────────────────────────────────────
  if (isPaid) {
    const tableEnd = (doc as any).lastAutoTable?.finalY ?? y + 40;
    const stampCX = pageW / 2;
    const stampCY = y + (tableEnd - y) / 2;

    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.4 }));
    setColor(doc, GREEN_STAMP, 'draw');
    doc.setLineWidth(2.5);

    const w = 60;
    const h = 20;
    doc.roundedRect(stampCX - w / 2, stampCY - h / 2, w, h, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    setColor(doc, GREEN_STAMP, 'text');

    doc.saveGraphicsState();
    const textX = stampCX;
    const textY = stampCY + 3;
    doc.setTextColor(...hexToRgb(GREEN_STAMP));
    doc.text('PAYÉ', textX, textY, {
      align: 'center',
      angle: 30,
    });
    doc.restoreGraphicsState();
    doc.restoreGraphicsState();
  }

  const tableEndY: number = (doc as any).lastAutoTable?.finalY ?? y + 60;

  // ──────────────────────────────────────────────────────────────────────────
  // BLOC FINANCIER (droite)
  // ──────────────────────────────────────────────────────────────────────────
  let calcY = tableEndY + 8;
  const calcW = 85;
  const calcX = pageW - margin - calcW;

  const calcRows: Array<[string, string, boolean]> = [
    ['Sous-total HT', formatCurrency(subtotal), false],
    [`TVA ${tvaRate}%`, formatCurrency(tvaAmount), false],
  ];

  calcRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, TEXT_GRAY, 'text');
    doc.text(label, calcX, calcY);
    setColor(doc, TEXT_DARK, 'text');
    doc.text(value, pageW - margin, calcY, { align: 'right' });
    calcY += 7;
  });

  setColor(doc, BRAND_BLUE, 'draw');
  doc.setLineWidth(0.8);
  doc.line(calcX, calcY - 2, pageW - margin, calcY - 2);

  setColor(doc, BRAND_BLUE, 'fill');
  doc.roundedRect(calcX, calcY, calcW, 14, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Net à Payer', calcX + 5, calcY + 9);
  doc.text(formatCurrency(netToPay), pageW - margin - 3, calcY + 9, { align: 'right' });

  calcY += 22;

  // ──────────────────────────────────────────────────────────────────────────
  // QR CODE
  // ──────────────────────────────────────────────────────────────────────────
  let qrY = tableEndY + 8;
  try {
    let qrData = `REF:${displayNumber}|ID:${invoice.id}|MONTANT:${netToPay}USD`;
    if (isPaid && invoice.payment_date) {
      qrData += `|STATUT:PAYE|DATE:${formatDate(invoice.payment_date)}`;
    }
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: { dark: '#1e3a5f', light: '#ffffff' },
    });
    const qrSize = 28;
    doc.addImage(qrDataUrl, 'PNG', margin, qrY, qrSize, qrSize);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setColor(doc, TEXT_GRAY, 'text');
    doc.text('QR de traçabilité', margin + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
  } catch (_) {
    // QR code generation failed silently
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ZONE SIGNATURE
  // ──────────────────────────────────────────────────────────────────────────
  const sigY = Math.max(calcY + 8, qrY + 36);
  setColor(doc, '#e5e7eb', 'draw');
  doc.setLineWidth(0.4);
  (doc as any).setLineDash([2, 2], 0);
  doc.rect(pageW - margin - 70, sigY, 70, 22, 'S');
  (doc as any).setLineDash([], 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setColor(doc, TEXT_GRAY, 'text');
  doc.text('Signature & Cachet Autorisés', pageW - margin - 35, sigY + 7, { align: 'center' });

  setColor(doc, '#d1d5db', 'draw');
  doc.setLineWidth(0.3);
  doc.line(pageW - margin - 64, sigY + 18, pageW - margin - 6, sigY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  setColor(doc, TEXT_GRAY, 'text');
  doc.text('Nom & Fonction', pageW - margin - 35, sigY + 21, { align: 'center' });

  // ──────────────────────────────────────────────────────────────────────────
  // FOOTER — MICRO-TEXTE
  // ──────────────────────────────────────────────────────────────────────────
  const footerY = pageH - 14;
  setColor(doc, BRAND_BLUE, 'draw');
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 3, pageW - margin, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  setColor(doc, TEXT_GRAY, 'text');

  const now = new Date();
  const genTime = now.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  doc.text(`Généré le ${genTime}  |  Réf. doc: ${invoice.id}  |  Document électronique — Okapia Medical`, margin, footerY);
  doc.text(`Page 1/1`, pageW - margin, footerY, { align: 'right' });

  return doc;
}

function getStatusLabelFr(status: string): string {
  const map: Record<string, string> = {
    draft: 'Brouillon',
    pending: 'En attente',
    partial: 'Partiel',
    paid: 'Payé',
    cancelled: 'Annulé',
  };
  return map[status] ?? status;
}

function getItemTypeFr(type: string): string {
  const map: Record<string, string> = {
    consultation: 'Consultation',
    medication: 'Médicament',
    lab_test: 'Analyse',
    procedure: 'Procédure',
  };
  return map[type] ?? type;
}
