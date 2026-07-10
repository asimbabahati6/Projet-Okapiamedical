import { useState, useEffect, useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Invoice, InvoiceItem, Patient } from '../../types/database';
import { downloadInvoicePDF } from '../../utils/printInvoice';

interface PrintableInvoiceViewProps {
  invoice: Invoice;
  onClose: () => void;
}

interface InvoiceItemRow {
  id: string;
  description: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PaymentRecord {
  id: string;
  payment_amount: number;
  payment_method: string;
  payment_date: string;
  numero_recu: string | null;
  devise_paiement: string | null;
}

export function PrintableInvoiceView({ invoice, onClose }: PrintableInvoiceViewProps) {
  const [items, setItems] = useState<InvoiceItemRow[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [invoice.id]);

  async function fetchInvoiceDetails() {
    const [{ data: itemsData }, { data: patientData }, { data: paymentsData }] = await Promise.all([
      supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id),
      invoice.patient_id
        ? supabase.from('patients').select('*').eq('id', invoice.patient_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('payment_history')
        .select('id, payment_amount, payment_method, payment_date, numero_recu, devise_paiement')
        .eq('invoice_id', invoice.id)
        .order('payment_date', { ascending: true }),
    ]);

    if (itemsData) {
      setItems(itemsData.map((i: Record<string, unknown>) => ({
        id: i.id as string,
        description: (i.description as string) || '',
        item_type: (i.item_type as string) || 'other',
        quantity: (i.quantity as number) || 1,
        unit_price: (i.unit_price as number) || 0,
        total_price: (i.total_price as number) || 0,
      })));
    }
    if (patientData) setPatient(patientData as Patient);
    if (paymentsData) setPayments(paymentsData as PaymentRecord[]);
    setLoading(false);
  }

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture ${invoice.invoice_number || 'BROUILLON'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 40px; }
          .invoice-container { max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 3px solid #1e40af; }
          .logo-section { display: flex; align-items: center; gap: 12px; }
          .logo-section img { width: 60px; height: 60px; object-fit: contain; }
          .clinic-name { font-size: 22px; font-weight: 700; color: #1e40af; }
          .clinic-info { text-align: right; font-size: 11px; color: #555; line-height: 1.6; }
          .invoice-meta { display: flex; justify-content: space-between; margin: 24px 0; }
          .invoice-left h2 { font-size: 24px; color: #1a1a1a; margin-bottom: 8px; }
          .invoice-left p { font-size: 12px; color: #666; margin: 2px 0; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 8px; }
          .status-paid { background: #dcfce7; color: #166534; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-partial { background: #dbeafe; color: #1e40af; }
          .status-cancelled { background: #fee2e2; color: #991b1b; }
          .patient-section { text-align: right; }
          .patient-section h3 { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 6px; }
          .patient-section p { font-size: 13px; color: #333; margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin: 24px 0; }
          thead { background: #1e40af; }
          thead th { padding: 10px 12px; text-align: left; color: white; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          thead th:nth-child(1) { text-align: center; width: 40px; }
          thead th:nth-child(3) { text-align: center; width: 60px; }
          thead th:nth-child(4), thead th:nth-child(5) { text-align: right; width: 120px; }
          tbody tr { border-bottom: 1px solid #e5e7eb; }
          tbody tr:nth-child(even) { background: #f8fafc; }
          tbody td { padding: 10px 12px; font-size: 12px; }
          tbody td:nth-child(1) { text-align: center; color: #888; }
          tbody td:nth-child(3) { text-align: center; }
          tbody td:nth-child(4), tbody td:nth-child(5) { text-align: right; }
          .totals { display: flex; justify-content: flex-end; margin-top: 16px; }
          .totals-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 24px; min-width: 280px; }
          .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #555; }
          .totals-row.net { border-top: 2px solid #1e40af; margin-top: 8px; padding-top: 10px; }
          .totals-row.net span { font-size: 16px; font-weight: 700; color: #1e40af; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; }
          .footer p { font-size: 10px; color: #999; margin: 3px 0; }
          .footer .thanks { font-style: italic; font-size: 11px; color: #666; margin-bottom: 8px; }
          .receipt-section { margin-top: 20px; padding: 14px 18px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; }
          .receipt-section h4 { font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 10px; }
          .receipt-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 12px; color: #333; }
          .receipt-number { font-weight: 700; color: #1e40af; }
          .currency-boxes { display: flex; gap: 16px; margin-top: 10px; padding-top: 8px; border-top: 1px solid #d1fae5; }
          .currency-box { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #333; }
          .check-box { display: inline-block; width: 14px; height: 14px; border: 1.5px solid #555; border-radius: 2px; text-align: center; line-height: 12px; font-size: 11px; font-weight: 700; }
          .check-box.checked { background: #1e40af; border-color: #1e40af; color: white; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  }

  async function handleDownloadPdf() {
    const invoiceItems: InvoiceItem[] = items.map(i => ({
      id: i.id,
      invoice_id: invoice.id,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total: i.total_price,
    }));
    await downloadInvoicePDF(invoice, invoiceItems, patient || undefined);
  }

  const displayNumber = invoice.invoice_number || (invoice as Record<string, unknown>).draft_number as string || 'BROUILLON';
  const subtotal = items.reduce((sum, i) => sum + i.total_price, 0);
  const tvaRate = (invoice as unknown as Record<string, number>).tva_rate || 0;
  const tvaAmount = (invoice as unknown as Record<string, number>).tva_amount || 0;
  const netToPay = invoice.net_to_pay || invoice.balance || invoice.total_amount;

  const invoiceNumeroRecu = (invoice as any).numero_recu as string | null;
  const invoiceDevisePaiement = (invoice as any).devise_paiement as string | null;

  const receiptsFromPayments = payments.filter(p => p.numero_recu);
  const hasReceipts = receiptsFromPayments.length > 0 || !!invoiceNumeroRecu;
  const lastDevise = receiptsFromPayments.length > 0
    ? receiptsFromPayments[receiptsFromPayments.length - 1].devise_paiement
    : invoiceDevisePaiement;

  const statusLabels: Record<string, string> = {
    paid: 'Payee', pending: 'En attente', partial: 'Partiel', cancelled: 'Annulee', draft: 'Brouillon',
  };
  const statusClasses: Record<string, string> = {
    paid: 'bg-green-100 text-green-800', pending: 'bg-yellow-100 text-yellow-800',
    partial: 'bg-blue-100 text-blue-800', cancelled: 'bg-red-100 text-red-800', draft: 'bg-gray-100 text-gray-600',
  };

  const methodLabels: Record<string, string> = {
    cash: 'Espèces', mobile_money: 'Mobile Money', bank_transfer: 'Virement bancaire',
    card: 'Carte bancaire', insurance: 'Assurance', 'Espèces': 'Espèces',
    'Carte bancaire': 'Carte bancaire', 'Mobile Money': 'Mobile Money', 'Assurance': 'Assurance',
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-3 text-sm">Chargement de la facture...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Apercu de la facture</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
          <div ref={printRef} className="bg-white rounded-xl shadow-sm max-w-[800px] mx-auto p-10">
            {/* Header */}
            <div className="flex justify-between items-start pb-5 border-b-[3px] border-blue-700 mb-6">
              <div className="flex items-center gap-3">
                <img
                  src="/Logo-Okapi-Medical.jpg"
                  alt="OKAPIA Medical"
                  className="w-14 h-14 object-contain"
                />
                <span className="text-2xl font-bold text-blue-700">OKAPIA Medical</span>
              </div>
              <div className="text-right text-xs text-gray-500 leading-relaxed">
                <p>Chaussée Mzée Kabila n°16.881</p>
                <p>Galerie Manfield, Kinshasa-Ngaliema</p>
                <p>Kinshasa, République Démocratique du Congo</p>
                <p>Direction : +243 817 659 057</p>
                <p>Réception : +243 823 800 104</p>
                <p>Email : info@okapiahospital.com</p>
                <p>RCCM : CD/KIN/RCCM/25-B-00412</p>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="flex justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">FACTURE</h2>
                <p className="text-sm text-gray-500">N: {displayNumber}</p>
                <p className="text-sm text-gray-500">Date: {new Date(invoice.created_at).toLocaleDateString('fr-FR')}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${statusClasses[invoice.status] || 'bg-gray-100 text-gray-600'}`}>
                  {statusLabels[invoice.status] || invoice.status}
                </span>
              </div>
              {patient && (
                <div className="text-right">
                  <h3 className="text-[11px] uppercase text-gray-400 tracking-wider mb-1 font-semibold">Patient</h3>
                  <p className="text-sm font-medium text-gray-900">{patient.last_name} {patient.first_name}</p>
                  {patient.patient_number && <p className="text-xs text-gray-500">N Dossier: {patient.patient_number}</p>}
                  {patient.phone && <p className="text-xs text-gray-500">Tél. {patient.phone}</p>}
                </div>
              )}
            </div>

            {/* Items Table */}
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-blue-700 text-white text-[11px] uppercase tracking-wide">
                  <th className="py-2.5 px-3 text-center w-10">#</th>
                  <th className="py-2.5 px-3 text-left">Description</th>
                  <th className="py-2.5 px-3 text-center w-14">Qte</th>
                  <th className="py-2.5 px-3 text-right w-28">Prix Unit.</th>
                  <th className="py-2.5 px-3 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-2.5 px-3 text-center text-xs text-gray-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 text-sm text-gray-800">{item.description}</td>
                    <td className="py-2.5 px-3 text-center text-sm">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right text-sm">{item.unit_price.toLocaleString('fr-FR')} USD</td>
                    <td className="py-2.5 px-3 text-right text-sm font-medium">{item.total_price.toLocaleString('fr-FR')} USD</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-4 min-w-[280px]">
                <div className="flex justify-between py-1 text-sm text-gray-600">
                  <span>Sous-total</span>
                  <span>{subtotal.toLocaleString('fr-FR')} USD</span>
                </div>
                {tvaRate > 0 && (
                  <div className="flex justify-between py-1 text-sm text-gray-600">
                    <span>TVA ({tvaRate}%)</span>
                    <span>{tvaAmount.toLocaleString('fr-FR')} USD</span>
                  </div>
                )}
                <div className="flex justify-between py-1 text-sm text-gray-600">
                  <span>Paye</span>
                  <span>{invoice.paid_amount.toLocaleString('fr-FR')} USD</span>
                </div>
                <div className="flex justify-between pt-3 mt-2 border-t-2 border-blue-700">
                  <span className="text-base font-bold text-blue-700">NET A PAYER</span>
                  <span className="text-lg font-bold text-blue-700">{netToPay.toLocaleString('fr-FR')} USD</span>
                </div>
                {invoice.payment_method && (
                  <div className="mt-2 text-xs text-gray-400">
                    Mode de paiement: {methodLabels[invoice.payment_method] || invoice.payment_method}
                  </div>
                )}
              </div>
            </div>

            {/* Receipt Proof Section */}
            {hasReceipts && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg" style={{ pageBreakInside: 'avoid' }}>
                <h4 className="text-[13px] font-bold text-green-800 mb-3">Preuve de paiement</h4>
                {receiptsFromPayments.length > 0 ? (
                  <div className="space-y-2">
                    {receiptsFromPayments.map((p, idx) => (
                      <div key={p.id} className="flex justify-between items-center text-[12px]">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{idx + 1}.</span>
                          <span className="font-bold text-blue-700">{p.numero_recu}</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-600">{new Date(p.payment_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-800">
                            {p.payment_amount.toLocaleString('fr-FR')} USD
                          </span>
                          {p.devise_paiement && (
                            <span className="text-xs text-gray-500">({p.devise_paiement})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : invoiceNumeroRecu ? (
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="font-bold text-blue-700">Reçu n° {invoiceNumeroRecu}</span>
                  </div>
                ) : null}

                {/* Currency checkboxes */}
                <div className="flex gap-5 mt-3 pt-3 border-t border-green-200">
                  <div className="flex items-center gap-2 text-[12px] text-gray-700">
                    <span
                      className={`inline-flex items-center justify-center w-[14px] h-[14px] border-[1.5px] rounded-sm text-[11px] font-bold leading-none ${
                        lastDevise === 'USD'
                          ? 'bg-blue-700 border-blue-700 text-white'
                          : 'border-gray-500 bg-white'
                      }`}
                    >
                      {lastDevise === 'USD' ? '\u2713' : ''}
                    </span>
                    Dollar (USD)
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-gray-700">
                    <span
                      className={`inline-flex items-center justify-center w-[14px] h-[14px] border-[1.5px] rounded-sm text-[11px] font-bold leading-none ${
                        lastDevise === 'CDF'
                          ? 'bg-blue-700 border-blue-700 text-white'
                          : 'border-gray-500 bg-white'
                      }`}
                    >
                      {lastDevise === 'CDF' ? '\u2713' : ''}
                    </span>
                    Franc (CDF)
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-10 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs italic text-gray-500 mb-2">Merci pour votre confiance. Ce document fait foi de facture.</p>
              <p className="text-[10px] text-gray-400">OKAPIA Medical - Chaussée Mzée Kabila n°16.881, Kinshasa-Ngaliema - Tél. +243 817 659 057</p>
              <p className="text-[10px] text-gray-400 mt-1">
                Générée le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
