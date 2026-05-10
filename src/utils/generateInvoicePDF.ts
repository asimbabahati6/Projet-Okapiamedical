import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, InvoiceItem, Patient } from '../types/database';

export async function generateInvoicePDF(
  invoice: Invoice,
  items: InvoiceItem[],
  patient?: Patient
): Promise<jsPDF> {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(30, 64, 175);
  doc.text('OKAPIA Medical', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Clinique OKAPIA - Kinshasa, RDC', 14, 28);

  const displayNumber = invoice.invoice_number ?? (invoice as any).draft_number ?? 'BROUILLON';
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Facture: ${displayNumber}`, 14, 44);

  doc.setFontSize(10);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString('fr-FR')}`, 14, 52);
  doc.text(`Statut: ${invoice.status}`, 14, 58);

  if (patient) {
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Patient:', 14, 70);
    doc.setFontSize(10);
    doc.text(`${patient.first_name} ${patient.last_name}`, 14, 77);
    doc.text(`N: ${patient.patient_number}`, 14, 83);
    if (patient.phone) doc.text(`Tel: ${patient.phone}`, 14, 89);
  }

  const tableData = items.map((item, index) => [
    String(index + 1),
    item.description || '-',
    String(item.quantity || 1),
    `${(item.unit_price || 0).toLocaleString()} $`,
    `${(item.total || 0).toLocaleString()} $`,
  ]);

  autoTable(doc, {
    startY: patient ? 96 : 70,
    head: [['#', 'Description', 'Qte', 'P.U.', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175] },
    styles: { fontSize: 9 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 140;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total: ${invoice.total_amount.toLocaleString()} $`, 140, finalY + 12);
  doc.text(`Paye: ${invoice.paid_amount.toLocaleString()} $`, 140, finalY + 20);
  doc.setFont('helvetica', 'bold');
  doc.text(`Solde: ${invoice.balance.toLocaleString()} $`, 140, finalY + 28);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Document genere par OKAPIA Medical', 14, 280);

  return doc;
}
