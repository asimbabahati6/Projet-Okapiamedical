import { useEffect, useState } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface InvoiceItem {
  id: string;
  description: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PaymentRow {
  id: string;
  payment_amount: number;
  payment_method: string;
  payment_date: string;
  devise_paiement: string | null;
  taux_applique: number | null;
  transaction_reference: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string | null;
  draft_number?: string | null;
  patient_id: string;
  patient?: { first_name: string; last_name: string; phone?: string; email?: string } | null;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'cancelled';
  payment_method: string | null;
  payment_date: string | null;
  net_to_pay?: number;
  numero_recu?: string | null;
  devise_paiement?: 'USD' | 'CDF' | null;
  created_at: string;
}

const TVA_RATE = 0.16;

function formatCurrency(amount: number, devise?: string | null): string {
  const currency = devise || 'USD';
  if (currency === 'CDF') return `${Math.round(amount).toLocaleString('fr-FR')} CDF`;
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-CD', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function PrintableInvoiceView({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [itemsRes, paymentsRes] = await Promise.all([
        supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id),
        supabase.from('payment_history').select('id, payment_amount, payment_method, payment_date, devise_paiement, taux_applique, transaction_reference').eq('invoice_id', invoice.id).order('payment_date', { ascending: true }),
      ]);
      if (!itemsRes.error && itemsRes.data) setItems(itemsRes.data as InvoiceItem[]);
      if (!paymentsRes.error && paymentsRes.data) setPayments(paymentsRes.data as PaymentRow[]);
      setLoading(false);
    }
    fetchData();
  }, [invoice.id]);

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const hasTva = (invoice.net_to_pay ?? 0) > subtotal && subtotal > 0;
  const tvaAmount = hasTva ? subtotal * TVA_RATE : 0;
  const netToPay = invoice.net_to_pay ?? subtotal + tvaAmount;
  const displayNumber = invoice.invoice_number || invoice.draft_number || '—';
  const devise = invoice.devise_paiement;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-auto print:bg-white print:static">
      {/* Action bar — hidden in print */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between bg-white/95 backdrop-blur border-b px-6 py-3">
        <div className="flex items-center gap-2 text-gray-700">
          <FileText className="w-5 h-5" />
          <span className="font-semibold text-sm">Aperçu de la facture</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Fermer
          </button>
        </div>
      </div>

      {/* Printable area */}
      <div className="mx-auto my-8 bg-white max-w-[210mm] min-h-[297mm] shadow-lg print:shadow-none print:my-0 print:max-w-none">
        <div className="px-12 py-10">
          {/* Hospital header */}
          <header className="flex items-start justify-between border-b-2 border-blue-700 pb-5 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-lg">
                  OK
                </div>
                <div>
                  <h1 className="text-xl font-bold text-blue-800 leading-tight">
                    Clinique Okapia Medical
                  </h1>
                  <p className="text-xs text-gray-500 tracking-wide">Établissement de santé agréé</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600 space-y-0.5 pl-[60px]">
                <p>Avenue de la Paix, Commune de Lingwala</p>
                <p>Kinshasa, République Démocratique du Congo</p>
                <p>Tél : +243 81 234 5678 · info@okapiamedical.cd</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">FACTURE</h2>
              <p className="text-sm text-gray-500 mt-1">N° {displayNumber}</p>
            </div>
          </header>

          {/* Invoice meta + patient */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Patient
              </h3>
              <p className="text-sm font-semibold text-gray-800">
                {invoice.patient
                  ? `${invoice.patient.last_name} ${invoice.patient.first_name}`
                  : 'Patient inconnu'}
              </p>
              {invoice.patient?.phone && (
                <p className="text-sm text-gray-600">Tél : {invoice.patient.phone}</p>
              )}
              {invoice.patient?.email && (
                <p className="text-sm text-gray-600">{invoice.patient.email}</p>
              )}
            </div>
            <div className="text-right">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Détails
              </h3>
              <p className="text-sm text-gray-700">
                <span className="text-gray-500">Date :</span>{' '}
                {formatDate(invoice.created_at)}
              </p>
              {invoice.payment_date && (
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Paiement :</span>{' '}
                  {formatDate(invoice.payment_date)}
                </p>
              )}
              {invoice.numero_recu && (
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Reçu N° :</span> {invoice.numero_recu}
                </p>
              )}
              <div className="mt-2">
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </div>
          </div>

          {/* Items table */}
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Chargement des lignes…</div>
          ) : (
            <table className="w-full text-sm border-collapse mb-8">
              <thead>
                <tr className="bg-gray-50 print:bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 w-[5%]">
                    #
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                    Description
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700 w-[12%]">
                    Quantité
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700 w-[18%]">
                    Prix unitaire
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700 w-[18%]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-3 py-6 text-center text-gray-400">
                      Aucune ligne de facturation
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id} className="even:bg-gray-50/50">
                      <td className="border border-gray-300 px-3 py-2 text-gray-500 text-center">
                        {idx + 1}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-gray-800">
                        {item.description}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-gray-700">
                        {formatCurrency(item.unit_price, devise)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-medium text-gray-800">
                        {formatCurrency(item.total_price, devise)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Totals */}
          <div className="flex justify-end mb-10">
            <div className="w-72">
              <div className="flex justify-between py-1.5 text-sm text-gray-600">
                <span>Sous-total</span>
                <span>{formatCurrency(subtotal, devise)}</span>
              </div>
              {hasTva && (
                <div className="flex justify-between py-1.5 text-sm text-gray-600">
                  <span>TVA ({(TVA_RATE * 100).toFixed(0)}%)</span>
                  <span>{formatCurrency(tvaAmount, devise)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-base font-bold text-gray-900 border-t-2 border-gray-800 mt-1">
                <span>Net à payer</span>
                <span>{formatCurrency(netToPay, devise)}</span>
              </div>
              {invoice.paid_amount > 0 && (
                <>
                  <div className="flex justify-between py-1 text-sm text-green-700">
                    <span>Montant payé</span>
                    <span>{formatCurrency(invoice.paid_amount, 'USD')}</span>
                  </div>
                  {invoice.balance > 0 && (
                    <div className="flex justify-between py-1 text-sm font-semibold text-orange-700">
                      <span>Solde restant</span>
                      <span>{formatCurrency(invoice.balance, 'USD')}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Payment history */}
          {payments.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Historique des paiements</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-green-50 print:bg-green-100">
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                    <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700">Montant</th>
                    <th className="border border-gray-300 px-3 py-2 text-right font-semibold text-gray-700">Equivalent</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700">Methode</th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700">Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => {
                    const d = p.devise_paiement || 'USD';
                    const taux = p.taux_applique || 0;
                    const equiv = d === 'USD' && taux > 0
                      ? `${Math.round(p.payment_amount * taux).toLocaleString('fr-FR')} CDF`
                      : d === 'CDF' && taux > 0
                        ? `${(p.payment_amount / taux).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                        : '—';
                    return (
                      <tr key={p.id} className="even:bg-gray-50/50">
                        <td className="border border-gray-300 px-3 py-1.5 text-gray-700">{formatDate(p.payment_date)}</td>
                        <td className="border border-gray-300 px-3 py-1.5 text-right font-medium text-gray-800">{formatCurrency(p.payment_amount, d)}</td>
                        <td className="border border-gray-300 px-3 py-1.5 text-right text-gray-500 text-xs">{equiv}</td>
                        <td className="border border-gray-300 px-3 py-1.5 text-center text-gray-600 capitalize">{p.payment_method}</td>
                        <td className="border border-gray-300 px-3 py-1.5 text-center text-gray-500 text-xs">{taux > 0 ? `1 USD = ${taux.toLocaleString('fr-FR')} CDF` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <footer className="border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-600 italic">
              Merci pour votre confiance.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Clinique Okapia Medical · Kinshasa, RDC · Facture générée le{' '}
              {new Date().toLocaleDateString('fr-CD')}
            </p>
          </footer>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .fixed { position: static !important; background: white !important; overflow: visible !important; }
          .fixed > .no-print { display: none !important; }
          .fixed > div:last-of-type,
          .fixed > div:last-of-type * { visibility: visible; }
          .fixed > div:last-of-type { margin: 0 !important; box-shadow: none !important; }
          .no-print { display: none !important; }
          @page { margin: 10mm 8mm; size: A4; }
        }
      `}</style>
    </div>
  );
}
