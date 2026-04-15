import { Invoice, InvoiceItem, Patient } from '../types/database';
import { generateInvoicePDF } from './generateInvoicePDF';

export async function printInvoice(
  invoice: Invoice,
  items: InvoiceItem[],
  patient?: Patient
): Promise<void> {
  const doc = await generateInvoicePDF(invoice, items, patient);
  const blobUrl = doc.output('bloburl');
  const win = window.open(blobUrl, '_blank');
  if (win) {
    win.focus();
    setTimeout(() => win.print(), 800);
  }
}

export async function downloadInvoicePDF(
  invoice: Invoice,
  items: InvoiceItem[],
  patient?: Patient
): Promise<void> {
  const doc = await generateInvoicePDF(invoice, items, patient);
  const displayNumber = invoice.invoice_number ?? (invoice as any).draft_number ?? 'BROUILLON';
  doc.save(`${displayNumber}.pdf`);
}
