import { Invoice, Patient } from '../types/database';

export interface CommunicationError {
  type: 'draft';
  message: string;
}

function getPatientData(invoice: Invoice, patient?: Patient) {
  const p = patient ?? invoice.patient;
  return {
    firstName: p?.first_name ?? 'Patient',
    lastName: p?.last_name ?? '',
    fullName: p ? `${p.first_name} ${p.last_name}` : 'Patient',
    phone: p?.phone?.replace(/\s+/g, '') ?? '',
    email: p?.email ?? '',
  };
}

function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} USD`;
}

export function getWhatsAppLink(
  invoice: Invoice,
  patient?: Patient
): string | null {
  if (invoice.status === 'draft') return null;

  const pat = getPatientData(invoice, patient);
  const netToPay = (invoice as any).net_to_pay ?? invoice.total_amount;
  const displayNumber = invoice.invoice_number ?? '';

  const message =
    `Bonjour ${pat.firstName},\n\n` +
    `Okapia Medical vous informe que votre facture *${displayNumber}* ` +
    `d'un montant de *${formatCurrency(netToPay)}* est disponible.\n\n` +
    `Pour toute information, veuillez contacter notre service de facturation.\n\n` +
    `Merci de votre confiance.\n\n` +
    `— Okapia Medical, Kinshasa`;

  const phone = pat.phone.startsWith('+') ? pat.phone.slice(1) : `243${pat.phone.replace(/^0/, '')}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function getEmailLink(
  invoice: Invoice,
  patient?: Patient
): string | null {
  if (invoice.status === 'draft') return null;

  const pat = getPatientData(invoice, patient);
  const netToPay = (invoice as any).net_to_pay ?? invoice.total_amount;
  const displayNumber = invoice.invoice_number ?? '';

  const subject = `Votre facture Okapia Medical — ${displayNumber}`;

  const body =
    `Cher(e) ${pat.fullName},\n\n` +
    `Veuillez trouver ci-joint votre facture ${displayNumber} concernant vos derniers soins ` +
    `au sein de notre établissement.\n\n` +
    `Montant net à payer : ${formatCurrency(netToPay)}\n` +
    `Statut : ${getStatusLabelFr(invoice.status)}\n\n` +
    `Pour toute question, notre équipe de facturation reste à votre disposition.\n\n` +
    `Cordialement,\n` +
    `L'équipe Okapia Medical\n` +
    `Av. Kasa-Vubu, Kinshasa — RDC\n` +
    `Tel: +243 997 000 000`;

  return `mailto:${pat.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
