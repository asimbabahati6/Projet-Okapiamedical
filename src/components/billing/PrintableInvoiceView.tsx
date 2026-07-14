import { useState, useEffect, useRef } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PatientInfo {
  first_name: string;
  last_name: string;
  phone: string | null;
  patient_number: string;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
}

interface InvoiceItemRow {
  id: string;
  description: string;
  item_type: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PaymentHistoryRow {
  id: string;
  payment_amount: number;
  payment_method: string;
  payment_date: string;
  transaction_reference: string | null;
  notes: string | null;
  recorded_by: string | null;
  numero_recu: string | null;
  devise_paiement: string | null;
  taux_applique: number | null;
  created_at: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces',
  bank_transfer: 'Virement',
  check: 'Chèque',
  card: 'Carte',
  mobile_money: 'Mobile Money',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  partial: 'Partiellement payée',
  paid: 'Payée',
  cancelled: 'Annulée',
};

function formatUSD(amount: number): string {
  return `${amount.toFixed(2)} USD`;
}

function formatCDF(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('fr-FR');
  return `${formatted} CDF`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getPaymentMethodLabel(method: string | null): string {
  if (!method) return '—';
  return PAYMENT_METHOD_LABELS[method] || method;
}

export function PrintableInvoiceView({ invoice, onClose }: { invoice: any; onClose: () => void }) {
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [items, setItems] = useState<InvoiceItemRow[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [patientRes, itemsRes, paymentsRes] = await Promise.all([
          supabase
            .from('patients')
            .select('first_name, last_name, phone, patient_number, date_of_birth, gender, address')
            .eq('id', invoice.patient_id)
            .maybeSingle(),
          supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', invoice.id),
          supabase
            .from('payment_history')
            .select('*')
            .eq('invoice_id', invoice.id)
            .order('created_at', { ascending: true }),
        ]);

        if (patientRes.data) setPatient(patientRes.data);
        if (itemsRes.data) setItems(itemsRes.data);
        if (paymentsRes.data) setPayments(paymentsRes.data);
      } catch (err) {
        console.error('Erreur lors du chargement des données de la facture:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [invoice.id, invoice.patient_id]);

  const subtotal = items.reduce((sum, item) => sum + (item.total_price ?? (item.quantity * item.unit_price)), 0);
  const tvaRate = invoice.tva_rate ?? 0;
  const tvaAmount = invoice.tva_amount ?? 0;
  const discountValue = invoice.discount_value ?? 0;
  const discountType = invoice.discount_type;
  const netToPay = invoice.net_to_pay ?? invoice.total_amount ?? subtotal;

  const totalPaidUSD = payments.reduce((sum, p) => {
    const amount = Number(p.payment_amount) || 0;
    if (p.devise_paiement === 'CDF' && p.taux_applique && p.taux_applique > 0) {
      return sum + (amount / p.taux_applique);
    }
    return sum + amount;
  }, 0);

  const remainingBalance = Math.max(0, netToPay - totalPaidUSD);

  function computeDiscountDisplay(): string {
    if (!discountValue || discountValue <= 0) return '';
    if (discountType === 'percentage') {
      const discountAmount = (subtotal * discountValue) / 100;
      return `- ${formatUSD(discountAmount)} (${discountValue}%)`;
    }
    return `- ${formatUSD(discountValue)}`;
  }

  function handlePrint() {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      window.print();
      return;
    }

    const printContent = printRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Facture ${invoice.invoice_number || ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            color: #1a1a1a;
            padding: 20mm;
            font-size: 11pt;
            line-height: 1.5;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #1e3a5f;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .clinic-name {
            font-size: 22pt;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 4px;
          }
          .clinic-subtitle {
            font-size: 9pt;
            color: #555;
          }
          .invoice-meta {
            text-align: right;
            font-size: 10pt;
          }
          .invoice-meta .inv-number {
            font-size: 14pt;
            font-weight: bold;
            color: #1e3a5f;
          }
          .section { margin-bottom: 18px; }
          .section-title {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #1e3a5f;
            border-bottom: 1px solid #ccc;
            padding-bottom: 4px;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
          }
          .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 24px;
            font-size: 10pt;
          }
          .patient-info .label { color: #666; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
          }
          table thead th {
            background: #1e3a5f;
            color: white;
            padding: 8px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          table thead th:last-child,
          table thead th:nth-child(3),
          table thead th:nth-child(4) {
            text-align: right;
          }
          table tbody td {
            padding: 7px 10px;
            border-bottom: 1px solid #e5e5e5;
          }
          table tbody td:last-child,
          table tbody td:nth-child(3),
          table tbody td:nth-child(4) {
            text-align: right;
          }
          table tbody tr:nth-child(even) { background: #f9fafb; }
          .totals-block {
            margin-top: 12px;
            display: flex;
            justify-content: flex-end;
          }
          .totals-table {
            width: 280px;
          }
          .totals-table td {
            padding: 4px 10px;
            font-size: 10pt;
            border: none;
          }
          .totals-table td:last-child { text-align: right; font-weight: 600; }
          .totals-table .grand-total td {
            font-size: 12pt;
            font-weight: bold;
            border-top: 2px solid #1e3a5f;
            padding-top: 8px;
            color: #1e3a5f;
          }
          .payments-table thead th { font-size: 8pt; }
          .payments-table tbody td { font-size: 9pt; }
          .equiv { color: #666; font-size: 8pt; }
          .payment-summary {
            margin-top: 10px;
            padding: 10px;
            background: #f0f7ff;
            border: 1px solid #bdd7f1;
            border-radius: 4px;
            font-size: 10pt;
          }
          .payment-summary .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .payment-summary .balance { font-weight: bold; color: #b91c1c; }
          .payment-summary .paid-full { font-weight: bold; color: #15803d; }
          .footer {
            margin-top: 30px;
            padding-top: 12px;
            border-top: 1px solid #ccc;
            font-size: 9pt;
            color: #666;
            display: flex;
            justify-content: space-between;
          }
          .status-badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 10px;
            font-size: 9pt;
            font-weight: 600;
          }
          .status-paid { background: #dcfce7; color: #15803d; }
          .status-partial { background: #fef3c7; color: #92400e; }
          .status-pending { background: #fee2e2; color: #b91c1c; }
          .status-cancelled { background: #e5e7eb; color: #6b7280; }
          .status-draft { background: #e5e7eb; color: #6b7280; }
          @media print {
            body { padding: 10mm; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto shadow-2xl">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-500">Chargement de la facture...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 rounded-xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl">
        {/* Modal toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-white rounded-t-xl border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Aperçu de la facture</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable content */}
        <div className="flex-1 overflow-auto p-6">
          <div
            ref={printRef}
            className="bg-white rounded-lg shadow-sm mx-auto"
            style={{
              maxWidth: '210mm',
              padding: '24px 32px',
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            {/* ─── Header ─── */}
            <div className="invoice-header flex justify-between items-start border-b-[3px] border-[#1e3a5f] pb-4 mb-5">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-12 h-12 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">CO</span>
                  </div>
                  <div>
                    <h1
                      className="text-2xl font-bold"
                      style={{ color: '#1e3a5f', fontFamily: "'Georgia', serif" }}
                    >
                      Cliniques Okapia
                    </h1>
                    <p className="text-xs text-gray-500">
                      Établissement médical — RD Congo
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-lg font-bold mb-1"
                  style={{ color: '#1e3a5f' }}
                >
                  {invoice.invoice_number || invoice.draft_number || '—'}
                </div>
                <div className="text-sm text-gray-600">
                  Date : {formatDate(invoice.created_at)}
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : invoice.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : invoice.status === 'cancelled'
                        ? 'bg-gray-200 text-gray-600'
                        : invoice.status === 'draft'
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {STATUS_LABELS[invoice.status] || invoice.status}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── Patient info ─── */}
            <div className="section mb-5">
              <h3
                className="text-xs font-bold uppercase tracking-wide border-b border-gray-300 pb-1 mb-2"
                style={{ color: '#1e3a5f' }}
              >
                Informations du patient
              </h3>
              {patient ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <div>
                    <span className="text-gray-500">Nom : </span>
                    <span className="font-medium">
                      {patient.last_name} {patient.first_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">N° Patient : </span>
                    <span className="font-medium">{patient.patient_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Téléphone : </span>
                    <span className="font-medium">{patient.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Sexe : </span>
                    <span className="font-medium">
                      {patient.gender === 'male'
                        ? 'Masculin'
                        : patient.gender === 'female'
                        ? 'Féminin'
                        : patient.gender || '—'}
                    </span>
                  </div>
                  {patient.date_of_birth && (
                    <div>
                      <span className="text-gray-500">Date de naissance : </span>
                      <span className="font-medium">
                        {formatDate(patient.date_of_birth)}
                      </span>
                    </div>
                  )}
                  {patient.address && (
                    <div>
                      <span className="text-gray-500">Adresse : </span>
                      <span className="font-medium">{patient.address}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Patient non trouvé
                </p>
              )}
            </div>

            {/* ─── Items table ─── */}
            <div className="section mb-5">
              <h3
                className="text-xs font-bold uppercase tracking-wide border-b border-gray-300 pb-1 mb-2"
                style={{ color: '#1e3a5f' }}
              >
                Détails de la facture
              </h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#1e3a5f' }}>
                    <th className="text-left text-white text-xs font-semibold uppercase tracking-wide py-2 px-3 rounded-tl">
                      Description
                    </th>
                    <th className="text-center text-white text-xs font-semibold uppercase tracking-wide py-2 px-3">
                      Qté
                    </th>
                    <th className="text-right text-white text-xs font-semibold uppercase tracking-wide py-2 px-3">
                      Prix unit.
                    </th>
                    <th className="text-right text-white text-xs font-semibold uppercase tracking-wide py-2 px-3 rounded-tr">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((item, idx) => {
                      const lineTotal =
                        item.total_price ?? item.quantity * item.unit_price;
                      return (
                        <tr
                          key={item.id}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="py-2 px-3 border-b border-gray-100">
                            {item.description}
                          </td>
                          <td className="py-2 px-3 border-b border-gray-100 text-center">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-3 border-b border-gray-100 text-right">
                            {formatUSD(item.unit_price)}
                          </td>
                          <td className="py-2 px-3 border-b border-gray-100 text-right font-medium">
                            {formatUSD(lineTotal)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 px-3 text-center text-gray-400 italic"
                      >
                        Aucun article
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mt-3">
                <div className="w-72">
                  <div className="flex justify-between py-1 px-3 text-sm">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-medium">{formatUSD(subtotal)}</span>
                  </div>

                  {tvaRate > 0 && (
                    <div className="flex justify-between py-1 px-3 text-sm">
                      <span className="text-gray-600">TVA ({tvaRate}%)</span>
                      <span className="font-medium">
                        {formatUSD(tvaAmount)}
                      </span>
                    </div>
                  )}

                  {discountValue > 0 && (
                    <div className="flex justify-between py-1 px-3 text-sm">
                      <span className="text-gray-600">
                        Remise
                        {invoice.discount_reason
                          ? ` (${invoice.discount_reason})`
                          : ''}
                      </span>
                      <span className="font-medium text-red-600">
                        {computeDiscountDisplay()}
                      </span>
                    </div>
                  )}

                  <div
                    className="flex justify-between py-2 px-3 mt-1 border-t-2 text-base"
                    style={{ borderColor: '#1e3a5f' }}
                  >
                    <span className="font-bold" style={{ color: '#1e3a5f' }}>
                      Net à payer
                    </span>
                    <span className="font-bold" style={{ color: '#1e3a5f' }}>
                      {formatUSD(netToPay)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Payment history (multi-currency) ─── */}
            <div className="section mb-5">
              <h3
                className="text-xs font-bold uppercase tracking-wide border-b border-gray-300 pb-1 mb-2"
                style={{ color: '#1e3a5f' }}
              >
                Historique des paiements
              </h3>

              {payments.length > 0 ? (
                <>
                  <table className="payments-table w-full text-sm border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: '#1e3a5f' }}>
                        <th className="text-left text-white text-[10px] font-semibold uppercase tracking-wide py-2 px-2 rounded-tl">
                          Date
                        </th>
                        <th className="text-right text-white text-[10px] font-semibold uppercase tracking-wide py-2 px-2">
                          Montant
                        </th>
                        <th className="text-center text-white text-[10px] font-semibold uppercase tracking-wide py-2 px-2">
                          Taux
                        </th>
                        <th className="text-right text-white text-[10px] font-semibold uppercase tracking-wide py-2 px-2">
                          Équivalent
                        </th>
                        <th className="text-left text-white text-[10px] font-semibold uppercase tracking-wide py-2 px-2">
                          Mode
                        </th>
                        <th className="text-left text-white text-[10px] font-semibold uppercase tracking-wide py-2 px-2 rounded-tr">
                          N° Reçu
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment, idx) => {
                        const amount = Number(payment.payment_amount) || 0;
                        const currency = payment.devise_paiement || 'USD';
                        const rate = payment.taux_applique
                          ? Number(payment.taux_applique)
                          : null;

                        let amountDisplay: string;
                        let equivalentDisplay: string;

                        if (currency === 'CDF') {
                          amountDisplay = formatCDF(amount);
                          if (rate && rate > 0) {
                            equivalentDisplay = `= ${formatUSD(amount / rate)}`;
                          } else {
                            equivalentDisplay = '—';
                          }
                        } else {
                          amountDisplay = formatUSD(amount);
                          if (rate && rate > 0) {
                            equivalentDisplay = `= ${formatCDF(amount * rate)}`;
                          } else {
                            equivalentDisplay = '—';
                          }
                        }

                        return (
                          <tr
                            key={payment.id}
                            className={
                              idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }
                          >
                            <td className="py-1.5 px-2 border-b border-gray-100 text-xs">
                              {formatDateTime(
                                payment.payment_date || payment.created_at
                              )}
                            </td>
                            <td className="py-1.5 px-2 border-b border-gray-100 text-right text-xs font-medium">
                              {amountDisplay}
                            </td>
                            <td className="py-1.5 px-2 border-b border-gray-100 text-center text-xs text-gray-500">
                              {rate ? `1 USD = ${formatCDF(rate)}` : '—'}
                            </td>
                            <td className="py-1.5 px-2 border-b border-gray-100 text-right text-xs text-gray-500">
                              {equivalentDisplay}
                            </td>
                            <td className="py-1.5 px-2 border-b border-gray-100 text-xs">
                              {getPaymentMethodLabel(payment.payment_method)}
                            </td>
                            <td className="py-1.5 px-2 border-b border-gray-100 text-xs text-gray-500">
                              {payment.numero_recu || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Payment summary */}
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">
                        Total payé (converti en USD)
                      </span>
                      <span className="font-semibold">
                        {formatUSD(totalPaidUSD)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Solde restant</span>
                      <span
                        className={`font-bold ${
                          remainingBalance <= 0
                            ? 'text-green-700'
                            : 'text-red-700'
                        }`}
                      >
                        {remainingBalance <= 0
                          ? 'Soldé'
                          : formatUSD(remainingBalance)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* Legacy invoice without payment history */
                <div className="text-sm">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Mode de paiement</span>
                      <span className="font-medium">
                        {getPaymentMethodLabel(invoice.payment_method)}
                      </span>
                    </div>
                    {invoice.devise_paiement && (
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">
                          Devise de paiement
                        </span>
                        <span className="font-medium">
                          {invoice.devise_paiement}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Montant payé</span>
                      <span className="font-semibold">
                        {formatUSD(invoice.paid_amount ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Solde</span>
                      <span
                        className={`font-bold ${
                          (invoice.balance ?? 0) <= 0
                            ? 'text-green-700'
                            : 'text-red-700'
                        }`}
                      >
                        {(invoice.balance ?? 0) <= 0
                          ? 'Soldé'
                          : formatUSD(invoice.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Footer ─── */}
            <div className="mt-8 pt-3 border-t border-gray-300 flex justify-between items-end text-xs text-gray-500">
              <div>
                {invoice.numero_recu && (
                  <div className="mb-1">
                    <span className="text-gray-500">N° Reçu : </span>
                    <span className="font-medium text-gray-700">
                      {invoice.numero_recu}
                    </span>
                  </div>
                )}
                {invoice.created_by && (
                  <div>
                    <span className="text-gray-500">Enregistré par : </span>
                    <span className="font-medium text-gray-700">
                      {invoice.created_by}
                    </span>
                  </div>
                )}
                {invoice.notes && (
                  <div className="mt-1">
                    <span className="text-gray-500">Notes : </span>
                    <span className="text-gray-700">{invoice.notes}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-[10px]">
                  Cliniques Okapia — Document généré le{' '}
                  {formatDateTime(new Date().toISOString())}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
