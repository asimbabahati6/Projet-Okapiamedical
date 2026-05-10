import { useState, useEffect } from 'react';
import { X, User, Calendar, DollarSign, CreditCard, FileText, CheckCircle, Printer, Download, MessageCircle, Mail, FileEdit } from 'lucide-react';
import { Invoice, InvoiceItem } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { downloadInvoicePDF, printInvoice } from '../../utils/printInvoice';
import { getWhatsAppLink, getEmailLink } from '../../utils/invoiceCommunication';

interface InvoiceDetailsModalProps {
  invoice: Invoice;
  onClose: () => void;
  onPayment?: (invoiceId: string, amount: number, method: string) => void;
  onEncaisser?: () => void;
  onPromoteDraft?: () => void;
}

export function InvoiceDetailsModal({
  invoice,
  onClose,
  onPayment,
  onEncaisser,
  onPromoteDraft,
}: InvoiceDetailsModalProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(invoice.balance.toString());
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const subtotal = invoice.total_amount;
  const tvaRate = (invoice as any).tva_rate ?? 16;
  const tvaAmount = (invoice as any).tva_amount ?? subtotal * (tvaRate / 100);
  const netToPay = (invoice as any).net_to_pay ?? subtotal + tvaAmount;
  const displayNumber = invoice.invoice_number ?? (invoice as any).draft_number ?? 'BROUILLON';
  const isDraft = invoice.status === 'draft';
  const canSend = !isDraft;

  useEffect(() => {
    async function fetchItems() {
      const { data } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);
      if (data) setItems(data);
    }
    fetchItems();
  }, [invoice.id]);

  function formatCurrency(amount: number) {
    return `${amount.toFixed(2)} USD`;
  }

  function handleSubmitPayment() {
    const amount = parseFloat(paymentAmount);
    if (amount > 0 && amount <= invoice.balance && onPayment) {
      onPayment(invoice.id, amount, paymentMethod);
      setShowPaymentForm(false);
    }
  }

  async function handlePrint() {
    setLoadingPdf(true);
    try {
      await printInvoice(invoice, items, invoice.patient as any);
    } finally {
      setLoadingPdf(false);
    }
  }

  async function handleDownload() {
    setLoadingPdf(true);
    try {
      await downloadInvoicePDF(invoice, items, invoice.patient as any);
    } finally {
      setLoadingPdf(false);
    }
  }

  function handleWhatsApp() {
    const link = getWhatsAppLink(invoice, invoice.patient as any);
    if (link) window.open(link, '_blank');
  }

  function handleEmail() {
    const link = getEmailLink(invoice, invoice.patient as any);
    if (link) window.location.href = link;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Détails de la Facture</h2>
            <p className="text-sm text-gray-600 font-mono">{displayNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <InvoiceStatusBadge status={invoice.status} size="md" />
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Date de création</p>
                <p className="font-semibold text-gray-900">
                  {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Sous-total HT</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(subtotal)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">TVA {tvaRate}%</p>
                <p className="text-xl font-bold text-gray-700">{formatCurrency(tvaAmount)}</p>
              </div>
              <div className="p-4 bg-blue-600 rounded-lg">
                <p className="text-sm text-blue-100 mb-1">Net à Payer</p>
                <p className="text-xl font-bold text-white">{formatCurrency(netToPay)}</p>
              </div>
            </div>

            {(invoice.status === 'partial' || invoice.paid_amount > 0) && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Montant Payé</p>
                  <p className="text-xl font-bold text-green-900">{formatCurrency(invoice.paid_amount)}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Solde Restant</p>
                  <p className="text-xl font-bold text-orange-900">{formatCurrency(invoice.balance)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Informations Patient
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nom complet</p>
                    <p className="font-medium text-gray-900">
                      {invoice.patient?.first_name} {invoice.patient?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Numéro patient</p>
                    <p className="font-medium text-gray-900">{invoice.patient?.patient_number}</p>
                  </div>
                  {invoice.patient?.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <p className="font-medium text-gray-900">{invoice.patient.phone}</p>
                    </div>
                  )}
                  {invoice.patient?.email && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{invoice.patient.email}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {items.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Actes Médicaux
                </h4>
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Qté</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">P.U.</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-gray-800">{item.description}</td>
                          <td className="px-4 py-2.5 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(item.unit_price ?? 0)}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900">{formatCurrency(item.total_price ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {invoice.payment_method && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  Informations de Paiement
                </h4>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Méthode de paiement</p>
                      <p className="font-medium text-gray-900">{invoice.payment_method}</p>
                    </div>
                    {invoice.payment_date && (
                      <div>
                        <p className="text-sm text-gray-600">Date de paiement</p>
                        <p className="font-medium text-gray-900">
                          {new Date(invoice.payment_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {invoice.notes && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Notes
                </h4>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                Historique
              </h4>
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Facture créée</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(invoice.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                {invoice.updated_at && invoice.updated_at !== invoice.created_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dernière mise à jour</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(invoice.updated_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                )}
                {invoice.payment_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Paiement effectué</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(invoice.payment_date).toLocaleString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!showPaymentForm && (invoice.status === 'pending' || invoice.status === 'partial') && onPayment && !onEncaisser && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowPaymentForm(true)}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <DollarSign className="w-5 h-5" />
                Effectuer un Paiement
              </button>
            </div>
          )}

          {showPaymentForm && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Enregistrer un Paiement</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant à payer</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={invoice.balance}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de paiement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">Espèces</option>
                    <option value="card">Carte bancaire</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="insurance">Assurance</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitPayment}
                    className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Confirmer le Paiement
                  </button>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={handlePrint}
                disabled={loadingPdf}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                {loadingPdf ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Printer className="w-4 h-4" />}
                Imprimer
              </button>
              <button
                onClick={handleDownload}
                disabled={loadingPdf}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <div className="relative group">
                <button
                  onClick={handleWhatsApp}
                  disabled={!canSend}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  WhatsApp
                </button>
                {!canSend && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                    Validez le brouillon avant d'envoyer
                  </div>
                )}
              </div>
              <div className="relative group">
                <button
                  onClick={handleEmail}
                  disabled={!canSend}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email
                </button>
                {!canSend && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                    Validez le brouillon avant d'envoyer
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {isDraft && onPromoteDraft && (
                <button
                  onClick={() => { onClose(); onPromoteDraft(); }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <FileEdit className="w-4 h-4" />
                  Valider le Brouillon
                </button>
              )}
              {(invoice.status === 'pending' || invoice.status === 'partial') && onEncaisser && (
                <button
                  onClick={() => { onClose(); onEncaisser(); }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Encaisser
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
