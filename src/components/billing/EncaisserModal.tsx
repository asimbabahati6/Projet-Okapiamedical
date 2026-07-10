import { useState } from 'react';
import { X, CreditCard, CheckCircle, MessageCircle, Mail, DollarSign, User, FileText, Tag, Receipt, Banknote } from 'lucide-react';
import { Invoice } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { getWhatsAppLink, getEmailLink } from '../../utils/invoiceCommunication';

interface EncaisserModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}

export function EncaisserModal({ invoice, onClose, onSuccess }: EncaisserModalProps) {
  const netToPay = (invoice as any).net_to_pay ?? invoice.total_amount;
  const subtotal = invoice.total_amount;
  const tvaRate = (invoice as any).tva_rate ?? 16;
  const tvaAmount = (invoice as any).tva_amount ?? subtotal * (tvaRate / 100);
  const discountValue = Number((invoice as any).discount_value || 0);
  const discountType: string = (invoice as any).discount_type || 'fixed';
  const discountReason: string | null = (invoice as any).discount_reason || null;
  const discountApplied = discountType === 'percentage'
    ? parseFloat((subtotal * Math.min(discountValue, 100) / 100).toFixed(2))
    : parseFloat(Math.min(discountValue, subtotal).toFixed(2));
  const hasDiscount = discountApplied > 0;

  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [amount, setAmount] = useState(invoice.balance.toString());
  const [reference, setReference] = useState('');
  const [devisePaiement, setDevisePaiement] = useState<'USD' | 'CDF'>('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState('');

  const patName = invoice.patient
    ? `${invoice.patient.first_name} ${invoice.patient.last_name}`
    : 'Patient inconnu';

  const displayNumber = invoice.invoice_number ?? (invoice as any).draft_number ?? 'N/A';

  async function handleConfirm() {
    const paidAmount = parseFloat(amount);
    if (isNaN(paidAmount) || paidAmount <= 0) {
      setError('Montant invalide');
      return;
    }
    if (paidAmount > invoice.balance) {
      setError(`Le montant ne peut pas dépasser le solde restant (${invoice.balance.toFixed(2)} USD)`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: recData, error: recError } = await supabase.rpc('generate_rec_receipt_number');
      if (recError) throw recError;
      const receiptNumber: string = recData;

      const newPaid = invoice.paid_amount + paidAmount;
      const newBalance = Math.max(0, netToPay - newPaid);
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          paid_amount: newPaid,
          balance: newBalance,
          status: newStatus,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          numero_recu: receiptNumber,
          devise_paiement: devisePaiement,
        })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      const { error: histError } = await supabase
        .from('payment_history')
        .insert({
          invoice_id: invoice.id,
          payment_amount: paidAmount,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          transaction_reference: reference || null,
          notes: `Encaissement via interface de facturation`,
          numero_recu: receiptNumber,
          devise_paiement: devisePaiement,
        });

      if (histError) throw histError;

      setGeneratedReceipt(receiptNumber);
      setSuccess(true);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  function handleWhatsApp() {
    const updatedInvoice = { ...invoice, status: 'pending' as const };
    const link = getWhatsAppLink(updatedInvoice, invoice.patient as any);
    if (link) window.open(link, '_blank');
  }

  function handleEmail() {
    const updatedInvoice = { ...invoice, status: 'pending' as const };
    const link = getEmailLink(updatedInvoice, invoice.patient as any);
    if (link) window.location.href = link;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Encaisser la Facture</h2>
              <p className="text-xs text-gray-500">{displayNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Paiement enregistré</h3>
              <p className="text-sm text-gray-600 mb-2">
                Le paiement de <span className="font-semibold">{parseFloat(amount).toFixed(2)} {devisePaiement}</span> a été enregistré avec succès.
              </p>
              {generatedReceipt && (
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-6">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Reçu n° {generatedReceipt}</span>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Notifier le patient</p>
                <div className="flex gap-3">
                  {invoice.patient?.phone && (
                    <button
                      onClick={handleWhatsApp}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </button>
                  )}
                  {invoice.patient?.email && (
                    <button
                      onClick={handleEmail}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-800">{patName}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Sous-total HT</p>
                    <p className="font-medium text-gray-800">{subtotal.toFixed(2)} USD</p>
                  </div>
                  {hasDiscount && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Remise{discountType === 'percentage' ? ` (${discountValue}%)` : ''}
                        {discountReason ? ` - ${discountReason.charAt(0).toUpperCase() + discountReason.slice(1)}` : ''}
                      </p>
                      <p className="font-medium text-orange-600">-{discountApplied.toFixed(2)} USD</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">TVA {tvaRate}%</p>
                    <p className="font-medium text-gray-800">{tvaAmount.toFixed(2)} USD</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Net à Payer</p>
                    <p className="font-bold text-blue-700">{netToPay.toFixed(2)} USD</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Solde restant</p>
                    <p className={`font-bold ${invoice.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {invoice.balance.toFixed(2)} USD
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Montant encaissé
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={invoice.balance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Currency selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Devise du règlement
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDevisePaiement('USD')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                        devisePaiement === 'USD'
                          ? 'border-green-500 bg-green-50 text-green-800 ring-1 ring-green-500/30'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      Dollar (USD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDevisePaiement('CDF')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                        devisePaiement === 'CDF'
                          ? 'border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500/30'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      Franc (CDF)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mode de paiement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>Espèces</option>
                    <option>Carte bancaire</option>
                    <option>Mobile Money</option>
                    <option>Assurance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Référence de transaction (optionnel)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Code transaction..."
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Confirmer le paiement
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
